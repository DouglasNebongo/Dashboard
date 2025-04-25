// app/api/convert/route.ts
import { convertToUSD } from '@/app/lib/currencyConverter';
import { NextResponse } from 'next/server';
import redisClient from '@/app/lib/redis';

export async function POST(request: Request) {
  const { amount, currency } = await request.json();
  
  if(!redisClient){
    console.log('redis not yet configured');
    return;
  }
  try {
    // Check if the rate is cached in Redis
    const cachedRate = await redisClient.get(`exchangeRate_${currency}`);
    let usdAmount: number;

    if (cachedRate) {
      // Use the cached rate
      usdAmount = amount * parseFloat(cachedRate);
    } else {
      // Fetch the rate from the API
      usdAmount = await convertToUSD(amount, currency);

      // Cache the rate in Redis (expire after 1 hour)
      await redisClient.set(`exchangeRate_${currency}`, usdAmount / amount, {
        EX: 3600, // 1 hour expiration
      });
    }

    return NextResponse.json({ usdAmount });
  } catch (error) {
    console.error('Error converting currency:', error);
    return NextResponse.json({ error: 'Failed to convert currency' }, { status: 500 });
  }
}