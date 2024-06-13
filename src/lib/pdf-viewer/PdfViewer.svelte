<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	import { Download, ChevronLeft, ChevronRight } from 'lucide-svelte';

	export let url;
	export let data;
	export let scale = 1.8;
	export let pageNum = 1; //must be number
	// export let flipTime = 120; //by default 2 minute, value in seconds

	export let totalPage = 0;
	export let downloadFileName = '';

	// pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

	let canvas;
	let page_num = 0;
	let pageCount = 0;
	let pdfDoc = null;
	let pageRendering = false;
	let pageNumPending = null;
	let rotation = 0;

	// let seconds = flipTime;
	let pages = [];

	let isInitialised = false;

	const renderPage = (num) => {
		pageRendering = true;
		// Using promise to fetch the page
		pdfDoc.getPage(num).then(function (page) {
			let viewport = page.getViewport({ scale: scale, rotation: rotation });
			const canvasContext = canvas.getContext('2d');
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// Render PDF page into canvas context
			let renderContext = {
				canvasContext,
				viewport
			};
			let renderTask = page.render(renderContext);

			// Wait for rendering to finish
			renderTask.promise.then(function () {
				pageRendering = false;
				if (pageNumPending !== null) {
					// New page rendering is pending
					// renderPage(pageNumPending);
					if (pageNum < pdfDoc.totalPage) {
						pages[pageNum] = canvas;
						pageNum++;
						pdfDoc.getPage(pageNum).then(renderPage);
					} else {
						for (let i = 1; i < pages.length; i++) {
							canvas.appendChild(pages[i]);
						}
					}
					pageNumPending = null;
				}
			});
		});
	};

	const queueRenderPage = (num) => {
		if (pageRendering) {
			pageNumPending = num;
		} else {
			renderPage(num);
		}
	};

	const initialLoad = async () => {
		pdfDoc = await pdfjs.getDocument({ data }).promise;
		totalPage = pdfDoc.numPages;
		isInitialised = true;
		queueRenderPage(pageNum);
	};
	function base64toBlob(b64Data, contentType = '', sliceSize = 512) {
		const byteCharacters = b64Data;
		const byteArrays = [];

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		const blob = new Blob(byteArrays, { type: contentType });
		return blob;
	}

	//Download pdf function
	const downloadPdf = (fileURL) => {
		const fileName = downloadFileName || fileURL.substring(fileURL.lastIndexOf('/') + 1);
		const blob = base64toBlob(fileURL, 'application/pdf');
		FileSaver.saveAs(blob, fileName);
	};
	let pdfjs;
	let FileSaver;
	onMount(async () => {
		pdfjs = await import('pdfjs-dist');
		// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.mjs',
			import.meta.url
		).toString();
		FileSaver = await import('file-saver');
		try {
			initialLoad();
		} catch (error) {
			console.log('error :>> ', error);
		}
	});
	onDestroy(() => {
		if (pdfDoc) {
			pdfDoc.destroy();
		}
	});
</script>

<button on:click={() => downloadPdf(data)}><Download /></button>

<div class="hidden">
	<span bind:this={page_num} />
	<span bind:this={pageCount} />
</div>
<!-- <div class="control"> -->
<canvas bind:this={canvas} class=" mx-auto max-w-full p-4 mt-2 mb-4 drop-shadow-lg" />
<!-- user grid to align buttons next to each other -->
<div class="grid grid-cols-2 gap-4 m-4">
	<button
		disabled={pageNum === 1}
		on:click={() => {
			if (pageNum > 1) {
				pageNum--;
				queueRenderPage(pageNum);
			}
		}}
	>
		<ChevronLeft />
		Prev</button
	>

	<button
		disabled={pageNum === totalPage}
		on:click={() => {
			if (pageNum < totalPage) {
				pageNum++;
				queueRenderPage(pageNum);
			}
		}}
		>Next
		<ChevronRight />
	</button>
</div>
