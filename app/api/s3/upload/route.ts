import { S3 } from "@/app/lib/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import z from "zod";


const uploadRequestSchema = z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number()
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validatedData = uploadRequestSchema.safeParse(body)

        if(!validatedData.success){
            return NextResponse.json(
                {error: "Invalid Request"},
                {status:400}
            )
        }

        const {filename, contentType, size} = validatedData.data
 
        const uniqueKey = `${crypto.randomUUID()}-${filename}`

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: contentType,
            ContentLength: size,
        })

        const presignedUrl = await getSignedUrl(S3,command,{
            expiresIn:3600, // 6 minutes
        })

        const response = {
            presignedUrl,
            key: uniqueKey
        }

        return NextResponse.json(
            response,
            {status:200}
        )

    } catch {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status:500}
        )
    }
}