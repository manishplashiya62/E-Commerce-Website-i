# Local Storage Cart Data Schema

The cart data is stored under the key `'cart'` as a JSON string containing an array of items.

### Key
`cart`

### Data Structure (Array of Objects)

```typescript
interface CartItem {
  id: number;          // Product ID
  name: string;        // Product Name
  price: number;       // Discounted Price
  originalPrice: number; // Original Price
  image: string;       // Primary product image URL
  quantity: number;    // Quantity added to cart
  category: string;    // Product category
}
```

### Example Storage Value
```json
[
  {
    "id": 1,
    "name": "AeroPro Wireless Noise Cancelling Headphones",
    "price": 14999,
    "originalPrice": 19999,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
    "quantity": 2,
    "category": "electronics"
  }
]
```
