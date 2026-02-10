-- Add listing_type to listings table
ALTER TABLE listings 
ADD COLUMN listing_type TEXT NOT NULL DEFAULT 'sell' 
CHECK (listing_type IN ('sell', 'rent', 'barter'));

-- Update comment for documentation
COMMENT ON COLUMN listings.listing_type IS 'Type of listing: sell, rent, or barter';
