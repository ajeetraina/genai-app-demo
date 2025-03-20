#!/bin/bash

# Remove files that are causing conflicts
rm -f integration/environment.go integration/testcontainers_helpers.go integration/fixed_test_setup.go

# Keep only the essential files
echo "Cleaned up conflicting files"