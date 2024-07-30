import React from 'react';
import Spacer from '@/components/ui/Spacer';
import { LoginProps } from '@/utils/types';
import UserInfo from './cards/UserInfoCard';
import SellCard from './cards/SellCard';

export default function Dashboard({ token, setToken }: LoginProps) {
  const backgroundImage = 'url("/pexels-wendywei-1190298.jpg")';

  return (
    <div className="home-page" style={{ backgroundImage: backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', height: '140vh' }}>
      <div className="cards-container">
        <Spacer size={150} />
        <SellCard />
        <Spacer size={10} />
        <UserInfo token={token} setToken={setToken} />
      </div>
    </div>
  );
}
