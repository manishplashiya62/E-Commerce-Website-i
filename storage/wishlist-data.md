# Local Storage Wishlist Data Schema

The wishlist data is stored under the key `'wishlist'` as a JSON string containing an array of items.

### Key
`wishlist`

### Data Structure (Array of Objects)

```typescript
interface WishlistItem {
  id: number;          // Product ID
  name: string;        // Product Name
  price: number;       // Discounted Price
  image: string;       // Primary product image URL
  category: string;    // Category string
}
```

### Example Storage Value
```json
[
  {
    "id": 2,
    "name": "Chronos Smart Watch Pro",
    "price": 8999,
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60",
    "category": "electronics"
  }
]
```
