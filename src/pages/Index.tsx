import React from 'react';
import { Header } from '@/components/Header';
import { LoginButton } from '@/components/LoginButton';
import { ReviewProcess } from '@/components/ReviewProcess';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="bg-white flex flex-col items-center text-base font-normal pt-20 pb-[49px] px-4">
      <main className="flex flex-col items-center w-full max-w-7xl">
        <Header />
        <LoginButton />
        <ReviewProcess />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
