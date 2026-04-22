-- Enable the pgvector extension for storing facial embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure the tables will be created in the public schema
SET search_path TO public;
