import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const formData = new FormData();
    
    // Voeg de private key server-side toe
    formData.append('access_key', process.env.WEB3FORMS_ACCESS_KEY || '');
    
    // Gebruik Array.from in plaats van for...of
    Array.from(data.entries()).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}