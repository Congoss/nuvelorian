import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { getTonConnectProviderProps } from '@/lib/platform/ton';
import ShopPanel from './ShopPanel';

export default function WalletShopPanel(props) {
  return (
    <TonConnectUIProvider {...getTonConnectProviderProps()}>
      <ShopPanel {...props} />
    </TonConnectUIProvider>
  );
}
