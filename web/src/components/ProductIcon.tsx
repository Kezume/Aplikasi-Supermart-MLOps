import React from "react";
import {
  Apple,
  Banana,
  Bean,
  Croissant,
  Pizza,
  Fish,
  Drumstick,
  Egg,
  Milk,
  CupSoda,
  Cookie,
  Beef,
  Carrot,
  WashingMachine,
  Droplets,
  Soup,
  Wheat,
  Cherry,
  Citrus,
  Grape,
  Nut,
  Package,
  ShoppingCart
} from "lucide-react";

interface ProductIconProps {
  name: string;
  className?: string;
}

export default function ProductIcon({ name, className = "h-6 w-6" }: ProductIconProps) {
  // Map product names to specific Lucide icons
  switch (name.toLowerCase()) {
    case "apple":
      return <Apple className={className} />;
    case "banana":
      return <Banana className={className} />;
    case "cereal":
      return <Wheat className={className} />;
    case "bread":
      return <Croissant className={className} />;
    case "pizza":
      return <Pizza className={className} />;
    case "fish":
      return <Fish className={className} />;
    case "chicken":
      return <Drumstick className={className} />;
    case "egg":
      return <Egg className={className} />;
    case "milk":
      return <Milk className={className} />;
    case "soda":
    case "cola":
      return <CupSoda className={className} />;
    case "cookie":
      return <Cookie className={className} />;
    case "minced meat":
    case "sausage":
    case "flatbread with meat":
      return <Beef className={className} />;
    case "potato":
    case "onion":
    case "cucumber":
    case "tomato":
      return <Carrot className={className} />;
    case "soap":
    case "shampoo":
      return <Droplets className={className} />;
    case "detergent":
    case "dish sponge":
      return <WashingMachine className={className} />;
    case "lentil":
    case "chickpeas":
    case "beans":
      return <Bean className={className} />;
    case "rice":
      return <Soup className={className} />;
    case "cheese":
    case "butter":
    case "yogurt":
    case "ice cream":
      return <Milk className={className} />;
    case "juice":
    case "water":
      return <CupSoda className={className} />;
    case "strawberry":
      return <Cherry className={className} />;
    case "orange":
      return <Citrus className={className} />;
    case "chips":
    case "cracker":
    case "chocolate":
    case "honey":
      return <Package className={className} />;
    default:
      return <ShoppingCart className={className} />;
  }
}
