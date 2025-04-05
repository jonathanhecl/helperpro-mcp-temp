// Example JavaScript file with functions and classes

// Function declaration
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}

// Arrow function
const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

// Class declaration
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  removeItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  getTotal() {
    return calculateTotal(this.items);
  }
}

// Another class
class Product {
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.price = price;
  }

  display() {
    return `${this.name}: ${formatPrice(this.price)}`;
  }
}
