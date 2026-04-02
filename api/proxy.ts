import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const targetUrl = req.query.url as string;
    console.log(`Proxy request for: ${targetUrl}`);
    if (!targetUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
        // Forward headers from the request
        const headers: Record<string, string> = {};
        if (req.headers['x-api-key']) {
            headers['x-api-key'] = req.headers['x-api-key'] as string;
        }
        
        const response = await axios.get(targetUrl, { headers });
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error(`Proxy error for ${targetUrl}:`, error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
        res.status(500).json({ error: "Failed to fetch from proxy", details: error.message });
    }
}
