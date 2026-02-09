from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response as StarletteResponse
import time
import logging

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> StarletteResponse:
        start_time = time.time()

        # Process the request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Add timing header to response
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"

        # Log performance metrics
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")

        # Check for slow requests (>4s for recipe refinements, >1s for other operations)
        if process_time > 4.0:
            logger.warning(f"SLOW REQUEST: {request.method} {request.url.path} took {process_time:.4f}s")
        elif process_time > 1.0:
            logger.info(f"MODERATE REQUEST: {request.method} {request.url.path} took {process_time:.4f}s")

        return response

# Function to calculate success rate
def calculate_success_rate(total_requests: int, failed_requests: int) -> float:
    """
    Calculate success rate as a percentage.

    Args:
        total_requests: Total number of requests processed
        failed_requests: Number of requests that resulted in errors

    Returns:
        Success rate as a percentage (0.0-100.0)
    """
    if total_requests == 0:
        return 100.0  # If no requests, success rate is 100%

    success_rate = ((total_requests - failed_requests) / total_requests) * 100.0
    return success_rate

# Global counters for tracking request performance
class RequestCounter:
    def __init__(self):
        self.total_requests = 0
        self.failed_requests = 0
        self.successful_requests = 0

    def increment_total(self):
        self.total_requests += 1

    def increment_failed(self):
        self.failed_requests += 1
        self.total_requests += 1  # Failed requests are still counted as requests

    def increment_successful(self):
        self.successful_requests += 1
        self.total_requests += 1  # Successful requests are still counted as requests

    def get_success_rate(self) -> float:
        return calculate_success_rate(self.total_requests, self.failed_requests)

# Global request counter instance
request_counter = RequestCounter()