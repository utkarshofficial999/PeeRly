-- Verify all indexes were created successfully
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'listings'
AND indexname LIKE 'idx_listings_%'
ORDER BY indexname;
