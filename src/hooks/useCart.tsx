import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get(`/stock/${productId}`)

      const udpatedCart = [...cart]
      const productInCart = udpatedCart.find(product => product.id === productId)

      const currentAmount = productInCart ? productInCart.amount : 0
      const amount = currentAmount + 1;


      if (productInCart) {
        if (amount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque')

          return;

        } else {
          productInCart.amount = amount
        }
      } else {
        const { data: product } = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product,
          amount: 1
        }

        udpatedCart.push(newProduct)
      }

      setCart(udpatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(udpatedCart))

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const udpatedCart = [...cart]
      const productIndex = udpatedCart.findIndex(product => product.id === productId)

      if (productIndex >= 0) {
        udpatedCart.splice(productIndex, 1)
        setCart(udpatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(udpatedCart))
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data: stock } = await api.get(`/stock/${productId}`)

      const sotckAmount = stock.amount

      if (amount > sotckAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const udpatedCart = [...cart]
      const productInCart = udpatedCart.find(product => product.id === productId)

      if (productInCart) {
        productInCart.amount = amount
        setCart(udpatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(udpatedCart))
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
