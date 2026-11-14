import { useLocalProfileHeaderSkin } from '@/lib/localProfileHeaderSkin';
import ProfileHeaderSkinPreview from './ProfileHeaderSkinPreview';

export default function ProfileHeaderSkin({ownerId}) {
  const skin=useLocalProfileHeaderSkin(ownerId);
  if(!skin.hasEquipped)return null;
  return <ProfileHeaderSkinPreview bossId={skin.activeBossId}/>;
}
