<script lang="ts">
	import type { PageData } from './$types';
	import PdfViewer from '$lib/pdf-viewer/PdfViewer.svelte';
	export let data: PageData;
</script>

<PdfViewer data={atob(data.pdf64)} downloadFileName={data.filename} />
