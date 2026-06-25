import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. Get the prompt the user typed in the frontend
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // =========================================================================
        // ⚠️ HEY COLLEAGUE: This is where you plug in the real RunPod AI Model! ⚠️
        // =========================================================================

        const USE_REAL_AI = false; // <-- Colleague: Change this to true when ready!

        if (USE_REAL_AI) {
            /* 
             * COLLEAGUE INSTRUCTIONS:
             * 1. Put your RunPod URL here
             * 2. Add your RunPod API Key to the Headers
             * 3. Send the 'prompt' variable to your model
             * 4. Map your model's response to match the 'mockRunpodResponse' format below.
             */

            const RUNPOD_URL = "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync";
            const RUNPOD_API_KEY = "YOUR_API_KEY_HERE"; // Best practice: Use process.env.RUNPOD_API_KEY

            const runpodResponse = await fetch(RUNPOD_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${RUNPOD_API_KEY}`,
                },
                body: JSON.stringify({
                    input: {
                        text_query: prompt,
                        // Add any other params your specific AI model needs here
                    }
                }),
            });

            const aiData = await runpodResponse.json();

            // Colleague: Process 'aiData' here and return it!
            // return NextResponse.json({ results: processedAiData });
        }

        // =========================================================================
        // Default Mock Response (While the real AI is being connected)
        // =========================================================================

        // Simulating a 1.5-second network delay to test the loading animation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // The frontend expects the data exactly in this array format:
        const mockRunpodResponse = [
            {
                id: "rp-1",
                title: "Echoes of the Net",
                artist: "RunPod AI Gen",
                tags: ["Cyberpunk", "Synth", "Fast"],
                audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            },
            {
                id: "rp-2",
                title: "Digital Horizon",
                artist: "RunPod AI Gen",
                tags: ["Ambient", "Space", "Slow"],
                audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
            }
        ];

        // Send the data back to the frontend
        return NextResponse.json({ results: mockRunpodResponse });

    } catch (error) {
        console.error("Error connecting to RunPod:", error);
        return NextResponse.json({ error: "Failed to fetch music" }, { status: 500 });
    }
}