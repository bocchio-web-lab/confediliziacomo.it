<script lang="ts">
    interface Props {
        class?: string;
    }

    let { class: className = "" }: Props = $props();
</script>

<svg
    viewBox="229 464 1339 725"
    xmlns="http://www.w3.org/2000/svg"
    class={className}
>
    <path
        d="m509.2 1155.2 116-154.7-93.9-130.7h-232Zm513.8 0 223.8 1-203.5-286.4h-232ZM231.1 836.6h318.6l97.6 134.5L745 836.6h311.3l265.2 351.8h-326l-95.8-130.8-95.7 130.8H487ZM1174 654.3l97.7 134.4 232-1.8-210-289.1Zm-407 129h223L787.3 497.7h-232ZM485.3 464.5h320.4l95.8 127 95.8-127H1314l254.2 353.6H1255L1155.6 682l-93.9 136.3H741.2l-93.9-129L550 817.5H229Zm0 0"
        class="fill-primary"
    />
</svg>
