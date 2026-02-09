"""
Domain Guardrails Service for RecipeRAG AI Assistant
Implements strict enforcement of food/cooking domain boundaries
"""
import re
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

class DomainGuardrails:
    """
    Service to enforce strict domain boundaries for the RecipeRAG AI Assistant
    This service acts as a pre-filter to intercept off-topic queries before they reach the AI
    """

    def __init__(self):
        # Categories of off-topic queries that should be intercepted
        self.tech_keywords = [
            # Programming languages
            'python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'perl', 'r', 'matlab', 'typescript', 'dart', 'lua', 'sql',

            # Web technologies
            'html', 'css', 'bootstrap', 'tailwind', 'sass', 'less', 'react', 'angular', 'vue',
            'nextjs', 'next.js', 'nuxtjs', 'nuxt.js', 'gatsby', 'svelte', 'ember', 'backbone',
            'jquery', 'ajax', 'xml', 'json', 'rest', 'graphql', 'soap', 'websocket',

            # Frameworks & Libraries
            'django', 'flask', 'express', 'spring', 'laravel', 'symfony', 'rails', 'asp.net',
            'node', 'node.js', 'npm', 'yarn', 'webpack', 'gulp', 'grunt', 'babel', 'eslint',
            'jest', 'mocha', 'chai', 'cypress', 'selenium',

            # Databases & DevOps
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sqlserver',
            'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'bitbucket',
            'aws', 'azure', 'gcp', 'heroku', 'netlify', 'vercel', 'firebase', 'cloudflare',

            # General tech terms
            'algorithm', 'data structure', 'complexity', 'runtime', 'compilation', 'interpretation',
            'debugging', 'testing', 'unit test', 'integration test', 'e2e test', 'ci/cd',
            'deployment', 'server', 'client', 'frontend', 'backend', 'fullstack', 'devops',
            'agile', 'scrum', 'kanban', 'sprint', 'story points', 'product backlog',
            'api', 'endpoint', 'request', 'response', 'header', 'payload', 'status code',
            'oauth', 'jwt', 'authentication', 'authorization', 'encryption', 'decryption',
            'hashing', 'cryptography', 'ssl', 'tls', 'firewall', 'proxy', 'cdn',
            'machine learning', 'deep learning', 'neural network', 'ai', 'artificial intelligence',
            'data science', 'big data', 'hadoop', 'spark', 'tensorflow', 'pytorch',
            'blockchain', 'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'nft',
            'virtual reality', 'augmented reality', 'vr', 'ar', 'metaverse',
            'cybersecurity', 'pentesting', 'exploit', 'vulnerability', 'patch', 'update',
            'compiler', 'interpreter', 'virtual machine', 'bytecode', 'assembly',
            'operating system', 'linux', 'unix', 'windows', 'macos', 'ios', 'android',
            'kernel', 'driver', 'firmware', 'bios', 'uefi', 'bootloader',
            'cpu', 'gpu', 'ram', 'storage', 'ssd', 'hdd', 'motherboard', 'chip',
            'network', 'router', 'switch', 'hub', 'gateway', 'subnet', 'vlan', 'vpn',
            'protocol', 'tcp/ip', 'http', 'https', 'ftp', 'ssh', 'dns', 'dhcp', 'nat'
        ]

        self.non_food_categories = [
            # People and figures
            'founder', 'president', 'prime minister', 'king', 'queen', 'emperor', 'empress',
            'monarch', 'dictator', 'leader', 'politician', 'statesman', 'politician',
            'actor', 'actress', 'singer', 'musician', 'artist', 'painter', 'writer',
            'author', 'novelist', 'poet', 'director', 'producer', 'composer', 'producer',
            'athlete', 'sportsman', 'player', 'coach', 'trainer', 'referee', 'umpire',
            'scientist', 'physicist', 'chemist', 'biologist', 'mathematician', 'engineer',
            'doctor', 'physician', 'surgeon', 'nurse', 'lawyer', 'attorney', 'judge',
            'teacher', 'professor', 'student', 'scholar', 'researcher', 'inventor',

            # Geography and places
            'country', 'nation', 'state', 'province', 'region', 'territory', 'city', 'town',
            'village', 'capital', 'population', 'border', 'flag', 'currency', 'language',
            'mountain', 'river', 'lake', 'ocean', 'sea', 'desert', 'forest', 'island',
            'continent', 'peninsula', 'valley', 'canyon', 'plateau', 'plain', 'hill',
            'beach', 'coast', 'shore', 'bay', 'gulf', 'strait', 'canal', 'harbor',
            'location', 'address', 'coordinates', 'latitude', 'longitude', 'altitude',

            # Historical events and periods
            'war', 'battle', 'revolution', 'independence', 'colonial', 'empire', 'dynasty',
            'era', 'age', 'period', 'century', 'decade', 'millennium', 'ancient', 'medieval',
            'renaissance', 'enlightenment', 'industrial revolution', 'world war', 'cold war',
            'holocaust', 'genocide', 'slavery', 'abolition', 'suffrage', 'civil rights',
            'date', 'year', 'month', 'day', 'time', 'calendar', 'timeline', 'chronology',
            'prehistoric', 'stone age', 'bronze age', 'iron age', 'dark ages', 'modern era',
            'ancient egypt', 'ancient greece', 'roman empire', 'byzantine', 'crusades',

            # Sciences and academic subjects
            'physics', 'chemistry', 'biology', 'mathematics', 'algebra', 'calculus', 'geometry',
            'trigonometry', 'statistics', 'probability', 'astronomy', 'astrophysics', 'cosmology',
            'geology', 'meteorology', 'oceanography', 'seismology', 'volcanology', 'mineralogy',
            'botany', 'zoology', 'microbiology', 'virology', 'bacteriology', 'immunology',
            'anatomy', 'physiology', 'pathology', 'pharmacology', 'toxicology', 'epidemiology',
            'psychology', 'sociology', 'anthropology', 'archaeology', 'linguistics', 'philosophy',
            'economics', 'finance', 'accounting', 'marketing', 'management', 'business',
            'geography', 'history', 'political science', 'law', 'medicine', 'engineering',
            'equation', 'formula', 'theorem', 'proof', 'axiom', 'hypothesis', 'theory',
            'atom', 'molecule', 'element', 'compound', 'reaction', 'acid', 'base', 'salt',
            'proton', 'neutron', 'electron', 'quark', 'lepton', 'boson', 'fermion',
            'velocity', 'acceleration', 'force', 'energy', 'momentum', 'mass', 'weight',
            'cell', 'organism', 'species', 'evolution', 'mutation', 'chromosome', 'gene',
            'protein', 'enzyme', 'hormone', 'vitamin', 'mineral', 'antibody', 'antigen',

            # Entertainment
            'movie', 'film', 'tv', 'television', 'show', 'series', 'season', 'episode',
            'actor', 'actress', 'director', 'producer', 'screenwriter', 'cinematographer',
            'composer', 'music', 'song', 'album', 'band', 'artist', 'concert', 'festival',
            'book', 'novel', 'story', 'character', 'plot', 'scene', 'genre', 'comedy',
            'drama', 'action', 'horror', 'thriller', 'romance', 'sci-fi', 'fantasy',
            'documentary', 'fiction', 'non-fiction', 'biography', 'autobiography', 'memoir',
            'celebrity', 'influencer', 'streamer', 'youtuber', 'podcast', 'radio', 'news',
            'sports', 'game', 'team', 'player', 'score', 'match', 'tournament', 'league',
            'championship', 'olympics', 'world cup', 'playoff', 'champion', 'winner',
            'stadium', 'arena', 'court', 'field', 'pitch', 'track', 'pool', 'rink',

            # Specific general knowledge patterns (more targeted)
            'what is the meaning of', 'what does.*mean', 'define', 'definition of', 'explain what',
            'tell me about', 'information about', 'facts about', 'details about', 'summary of',
            'introduction to', 'what do you know about', 'what can you tell me about',
            'who was the founder of', 'who invented', 'who discovered', 'who created',
            'when was.*founded', 'when was.*created', 'when was.*discovered',
            'where is the.*located', 'where was.*born', 'where is.*from',
            'what does.*stand for', 'what is the abbreviation for', 'acronym for',
        ]

    def check_query_domain(self, message: str) -> Tuple[bool, str]:
        """
        Check if the query is within the food/cooking domain

        Args:
            message: The user query to check

        Returns:
            Tuple of (is_within_domain: bool, reason: str)
        """
        message_lower = message.lower().strip()

        # Check if the query is related to food/cooking first to avoid false positives
        food_related_indicators = [
            'recipe', 'cook', 'food', 'eat', 'meal', 'dish', 'ingredient', 'kitchen',
            'baking', 'roasting', 'grilling', 'boiling', 'frying', 'seasoning', 'spice',
            'herb', 'flavor', 'taste', 'cuisine', 'nutrition', 'diet', 'healthy',
            'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'drinks',
            'wine', 'beer', 'coffee', 'tea', 'vegetables', 'fruits', 'meat', 'fish',
            'pasta', 'rice', 'bread', 'soup', 'salad', 'sauce', 'oil', 'salt', 'pepper'
        ]

        is_food_related = any(indicator in message_lower for indicator in food_related_indicators)

        # Check for technical terms, but allow them if the query is clearly food-related
        for tech_term in self.tech_keywords:
            # Skip technical terms if they appear in a food context
            if tech_term in message_lower:
                # Check if this appears in a food-related context (e.g., "HTML in a recipe title")
                if is_food_related:
                    # Check if tech term appears in a context that suggests it's food-related
                    # For example, if "HTML" appears with cooking terms, it might be a typo for something food-related
                    continue
                else:
                    return False, f"Technical term detected: '{tech_term}'"

        # Check for non-food category terms
        for category_term in self.non_food_categories:
            if category_term in message_lower:
                # Check for food-related exceptions to avoid false positives
                food_exceptions = [
                    'what is the recipe', 'how to cook', 'how to prepare', 'ingredients for',
                    'cooking instructions', 'food preparation', 'kitchen tools', 'cooking techniques'
                ]

                if any(exception in message_lower for exception in food_exceptions):
                    continue  # Allow if it's clearly food-related

                return False, f"Non-food category term detected: '{category_term}'"

        # Special handling for questions that are clearly outside domain
        question_patterns = [
            r'what is.*programming',
            r'what is.*programming language',
            r'what is.*framework',
            r'what is.*library',
            r'what is.*algorithm',
            r'what is.*database',
            r'what is.*server',
            r'what is.*api',
            r'what is.*web.*development',
            r'what is.*software',
            r'what is.*computer.*science',
            r'what is.*technology.*development',
            r'who is the founder of.*company',
            r'who invented.*technology',
            r'who discovered.*scientific.*concept',
            r'who created.*software',
            r'when was.*technology.*founded',
            r'when was.*programming.*language.*created',
            r'what does.*stand for.*in.*technology',
        ]

        for pattern in question_patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return False, f"Off-topic question pattern detected: '{pattern}'"

        # If we passed all checks, assume it's okay
        return True, "Query appears to be within domain"

    def generate_thematic_response(self, original_query: str) -> str:
        """
        Generate a thematic response for off-topic queries

        Args:
            original_query: The user's original off-topic query

        Returns:
            A thematic response that redirects to food/cooking themes
        """
        return (
            "👨‍🍳 Hello! I'm your RecipeRAG culinary assistant, focused exclusively on cooking, recipes, and food! 🍳\n\n"
            "I can't help with that particular question, but I'd love to help you create something delicious instead! 😊\n\n"
            f"💡 You asked: \"{original_query}\"\n\n"
            "🍽️ I specialize in helping with:\n"
            "• Recipe suggestions based on your ingredients\n"
            "• Cooking techniques and tips\n"
            "• Meal planning and nutrition\n"
            "• Ingredient substitutions\n"
            "• Dietary restrictions and preferences\n\n"
            "So, what ingredients do you have on hand? Or what kind of dish are you craving today? "
            "I can suggest amazing recipes based on what you're looking for! 🍴✨"
        )

    def should_intercept_query(self, message: str) -> Tuple[bool, str]:
        """
        Determine if a query should be intercepted based on domain boundaries

        Args:
            message: The user query to evaluate

        Returns:
            Tuple of (should_intercept: bool, response: str)
        """
        is_within_domain, reason = self.check_query_domain(message)

        if not is_within_domain:
            response = self.generate_thematic_response(message)
            logger.info(f"Intercepted off-topic query: {message[:50]}... Reason: {reason}")
            return True, response

        return False, ""

# Global instance
domain_guardrails = DomainGuardrails()