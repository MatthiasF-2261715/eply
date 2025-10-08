import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const formData = new FormData();
    
    // Voeg de access key toe
    formData.append('access_key', process.env.WEB3FORMS_ACCESS_KEY || '');
    
    // Kopieer alle form velden
    Array.from(data.entries()).forEach(([key, value]) => {
      if (key !== 'access_key') { // Voorkom dubbele access key
        formData.append(key, value);
      }
    });
    
    // Headers toevoegen voor correcte verwerking
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData
    });

    // Check voor geldige JSON response
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Er ging iets mis bij het versturen');
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Er ging iets mis bij het versturen' },
      { status: 500 }
    );
  }
}