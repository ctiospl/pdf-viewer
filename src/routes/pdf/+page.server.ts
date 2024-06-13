import type { PageServerLoad } from './$types';

export const load = (async ({fetch}) => {
    const result = await fetch('https://www.clickdimensions.com/links/TestPDFfile.pdf');
    console.log(result);
    const pdfBlob = await result.blob();
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    const pdf64 = buffer.toString('base64');
    console.log('pdf64 :>> ', pdf64);
    return { pdf64, filename: `filename.pdf` };
}) satisfies PageServerLoad;
