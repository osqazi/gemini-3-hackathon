import time
import asyncio
from collections import defaultdict, deque
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response as StarletteResponse
import logging
from typing import Dict, Deque, Optional
from dataclasses import dataclass
from threading import Lock

logger = logging.getLogger(__name__)

@dataclass
class RateLimitConfig:
    requests: int
    window: int  # in seconds

class RateLimitManager:
    def __init__(self):
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)
        self.lock = Lock()

        # Default rate limits
        self.default_limits = {
            'unauthenticated': RateLimitConfig(requests=50, window=3600),  # 50 requests per hour
            'authenticated': RateLimitConfig(requests=100, window=3600),   # 100 requests per hour
            'api_external': RateLimitConfig(requests=60, window=60),       # 60 requests per minute for external APIs
        }

    def is_allowed(self, identifier: str, limit_type: str = 'authenticated') -> bool:
        """
        Check if the request is allowed based on rate limits.

        Args:
            identifier: Unique identifier for the user/client (e.g., user_id, IP address)
            limit_type: Type of rate limit to apply

        Returns:
            True if request is allowed, False otherwise
        """
        with self.lock:
            now = time.time()
            limit_config = self.default_limits.get(limit_type, self.default_limits['authenticated'])

            # Get request history for this identifier
            request_times = self.requests[identifier]

            # Remove requests that are outside the current window
            while request_times and request_times[0] <= now - limit_config.window:
                request_times.popleft()

            # Check if we've exceeded the limit
            if len(request_times) >= limit_config.requests:
                return False

            # Add current request to the queue
            request_times.append(now)
            return True

    def get_reset_time(self, identifier: str, limit_type: str = 'authenticated') -> int:
        """
        Get the time when the rate limit will reset for the given identifier.

        Args:
            identifier: Unique identifier for the user/client
            limit_type: Type of rate limit

        Returns:
            Unix timestamp when the rate limit will reset
        """
        with self.lock:
            request_times = self.requests[identifier]
            if not request_times:
                return int(time.time())

            limit_config = self.default_limits.get(limit_type, self.default_limits['authenticated'])
            return int(request_times[0] + limit_config.window)

# Global rate limiter instance
rate_limiter = RateLimitManager()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> StarletteResponse:
        # Determine the identifier for rate limiting (user ID if authenticated, IP address otherwise)
        identifier = self.get_identifier(request)

        # Determine the appropriate rate limit type
        limit_type = self.get_limit_type(request, identifier)

        # Check if request is allowed
        if not rate_limiter.is_allowed(identifier, limit_type):
            reset_time = rate_limiter.get_reset_time(identifier, limit_type)
            retry_after = max(0, reset_time - int(time.time()))

            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={
                    "X-RateLimit-Limit": str(rate_limiter.default_limits[limit_type].requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(retry_after),
                }
            )

        # Add rate limit headers to the response
        limit_config = rate_limiter.default_limits[limit_type]
        request_times = rate_limiter.requests[identifier]
        remaining = max(0, limit_config.requests - len(request_times))

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit_config.requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(rate_limiter.get_reset_time(identifier, limit_type))

        return response

    def get_identifier(self, request: Request) -> str:
        """Get the identifier for rate limiting (user ID or IP address)."""
        # If user is authenticated, use user ID
        if hasattr(request.state, 'user_id') and request.state.user_id:
            return f"user:{request.state.user_id}"

        # Otherwise, use IP address
        client_host = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the list (real client IP)
            client_host = forwarded_for.split(",")[0].strip()

        return f"ip:{client_host}"

    def get_limit_type(self, request: Request, identifier: str) -> str:
        """Determine the rate limit type based on the request."""
        # Check if this is an external API call (e.g., to Gemini)
        if "/api/gemini" in str(request.url) or "gemini" in str(request.url):
            return "api_external"

        # Check if user is authenticated
        if identifier.startswith("user:"):
            return "authenticated"
        else:
            return "unauthenticated"


# Queue implementation for handling requests during rate limiting
class RequestQueue:
    def __init__(self):
        self.queue: Deque[Dict] = deque()
        self.processing = False
        self.lock = asyncio.Lock()

    async def add_request(self, request_func, *args, **kwargs):
        """Add a request to the queue."""
        async with self.lock:
            request_item = {
                'func': request_func,
                'args': args,
                'kwargs': kwargs,
                'timestamp': time.time(),
                'retry_count': 0
            }
            self.queue.append(request_item)

            # Start processing if not already running
            if not self.processing:
                asyncio.create_task(self._process_queue())

            return len(self.queue)  # Return queue position

    async def _process_queue(self):
        """Process requests in the queue."""
        async with self.lock:
            self.processing = True

        while True:
            async with self.lock:
                if not self.queue:
                    self.processing = False
                    break

                request_item = self.queue.popleft()

            try:
                # Execute the request
                result = await request_item['func'](*request_item['args'], **request_item['kwargs'])

                # Success - no need to retry
                continue
            except Exception as e:
                # Failed to process request
                request_item['retry_count'] += 1

                # If we've retried too many times, drop the request
                if request_item['retry_count'] < 3:
                    # Put it back in the queue for retry after a delay
                    await asyncio.sleep(1)  # Wait 1 second before retry
                    async with self.lock:
                        self.queue.append(request_item)
                else:
                    logger.error(f"Request failed after {request_item['retry_count']} attempts: {str(e)}")

# Global request queue instance
request_queue = RequestQueue()


# Cache implementation for API responses
class APICache:
    def __init__(self, ttl: int = 300):  # 5 minutes default TTL
        self.cache: Dict[str, Dict] = {}
        self.ttl = ttl  # Time to live in seconds

    def _get_key(self, method: str, url: str, params: dict = None, body: dict = None) -> str:
        """Generate a cache key based on request details."""
        import hashlib
        import json

        cache_input = f"{method}:{url}"
        if params:
            cache_input += f":params:{sorted(params.items())}"
        if body:
            cache_input += f":body:{json.dumps(body, sort_keys=True)}"

        return hashlib.sha256(cache_input.encode()).hexdigest()

    def get(self, method: str, url: str, params: dict = None, body: dict = None) -> Optional[dict]:
        """Get cached response if available and not expired."""
        key = self._get_key(method, url, params, body)

        if key in self.cache:
            cached_item = self.cache[key]
            if time.time() - cached_item['timestamp'] < self.ttl:
                logger.info(f"Cache HIT for key: {key[:8]}...")
                return cached_item['data']
            else:
                # Expired, remove from cache
                del self.cache[key]

        logger.info(f"Cache MISS for key: {key[:8]}...")
        return None

    def set(self, method: str, url: str, data: dict, params: dict = None, body: dict = None):
        """Cache a response."""
        key = self._get_key(method, url, params, body)
        self.cache[key] = {
            'data': data,
            'timestamp': time.time()
        }

# Global cache instance
api_cache = APICache(ttl=300)  # 5 minute TTL


# Decorator to implement rate limiting with queuing and caching
def rate_limit_with_cache(limit_type: str = 'authenticated', ttl: int = 300):
    """
    Decorator to add rate limiting with queuing and caching to API endpoints.

    Args:
        limit_type: Type of rate limit to apply
        ttl: Time to live for cached responses (in seconds)
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request from arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                raise ValueError("Request object not found in function arguments")

            # Get identifier
            identifier = rate_limiter.get_identifier(request)

            # Check rate limit
            if not rate_limiter.is_allowed(identifier, limit_type):
                # If rate limited, try to queue the request
                logger.warning(f"Rate limit reached for {identifier}, attempting to queue request")

                try:
                    # Add to queue and return a response indicating queued status
                    queue_position = await request_queue.add_request(func, *args, **kwargs)
                    return {
                        "status": "queued",
                        "message": "Request queued due to rate limiting",
                        "queue_position": queue_position
                    }
                except Exception as e:
                    logger.error(f"Failed to queue request: {str(e)}")
                    raise HTTPException(status_code=429, detail="Rate limit exceeded")

            # Check cache first
            cache_key = api_cache._get_key(
                request.method,
                str(request.url),
                dict(request.query_params)
            )

            cached_result = api_cache.get(
                request.method,
                str(request.url),
                dict(request.query_params)
            )

            if cached_result:
                return cached_result

            # Execute the original function
            result = await func(*args, **kwargs)

            # Cache the result
            api_cache.set(
                request.method,
                str(request.url),
                result,
                dict(request.query_params)
            )

            return result

        return wrapper
    return decorator