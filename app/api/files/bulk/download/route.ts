import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // TODO: Implement bulk download by fetching files from Hostinger
  // The 'archiver' package causes Vercel build errors (Webpack 'Default condition should be last one')
  // We need to replace it with JSZip or adm-zip, and fetch the files over HTTP from Hostinger.
  return new NextResponse("Bulk download is temporarily disabled while we migrate to Hostinger", { status: 501 })
}
