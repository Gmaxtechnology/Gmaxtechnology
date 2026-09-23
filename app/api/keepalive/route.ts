import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: "success",
      message: "Supabase keep-alive successful"
    })

  } catch (error) {

    return NextResponse.json(
      {
        status: "error",
        message: "Supabase connection failed"
      },
      {
        status: 500
      }
    )
  }
}