# Local Storage User Data Schema

The user profile and orders are stored under the keys `'user'` and `'orders'` respectively as JSON strings.

### Keys
1. `user` - Contains general user details and contact info.
2. `orders` - List of orders placed by the user.

### User Schema (Object)

```typescript
interface UserProfile {
  id: string;          // User ID (e.g., usr_99)
  name: string;        // Full Name
  email: string;       // Email Address
  phone: string;       // Phone Number
  addresses: Address[]; // Array of saved addresses
}

interface Address {
  id: string;
  type: string;        // E.g., 'Home', 'Office'
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}
```

### Orders Schema (Array of Objects)

```typescript
interface Order {
  orderId: string;     // Unique Order Reference (e.g., ORD-2026-9810)
  date: string;        // ISO Date String
  items: OrderItem[];  // Array of items in the order
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
}

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
```
