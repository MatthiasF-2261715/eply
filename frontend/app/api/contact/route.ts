import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const formData = new FormData();
    
    // Web3Forms verwacht een specifiek formaat
    formData.append('access_key', process.env.WEB3FORMS_ACCESS_KEY || '');
    formData.append('name', data.get('name') as string);
    formData.append('email', data.get('email') as string);
    formData.append('message', data.get('message') as string);
    formData.append('botcheck', data.get('botcheck') as string);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    const responseData = await response.text(); // Eerst als text ophalen
    const jsonData = responseData ? JSON.parse(responseData) : null; // Dan pas parsen

    if (!response.ok || !jsonData?.success) {
      throw new Error(jsonData?.message || 'Versturen mislukt.');
    }

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Er ging iets mis bij het versturen' },
      { status: 500 }
    );
  }
}