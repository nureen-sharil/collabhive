#!/bin/bash
# Database initialization and migration script

# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS collab_hive;"

# Run migrations (when alembic is set up)
# alembic upgrade head

echo "Database setup complete!"
