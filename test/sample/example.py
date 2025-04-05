# Example Python file with functions and classes

# Function definition
def calculate_total(items):
    return sum(item['price'] for item in items)

# Another function
def format_price(price):
    return f"${price:.2f}"

# Class definition
class ShoppingCart:
    def __init__(self):
        self.items = []
    
    def add_item(self, item):
        self.items.append(item)
    
    def remove_item(self, id):
        for i, item in enumerate(self.items):
            if item['id'] == id:
                del self.items[i]
                break
    
    def get_total(self):
        return calculate_total(self.items)

# Another class
class Product:
    def __init__(self, id, name, price):
        self.id = id
        self.name = name
        self.price = price
    
    def display(self):
        return f"{self.name}: {format_price(self.price)}"
