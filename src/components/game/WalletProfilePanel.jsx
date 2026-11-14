import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { getTonConnectProviderProps } from '@/lib/platform/ton';
import ProfilePanel from './ProfilePanel';

export default function WalletProfilePanel(props) {
  return (
    <TonConnectUIProvider {...getTonConnectProviderProps()}>
      <ProfilePanel {...props} />
    </TonConnectUIProvider>
  );
}
