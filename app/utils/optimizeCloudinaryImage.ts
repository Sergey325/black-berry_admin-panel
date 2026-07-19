export function optimizeCloudinaryUrl(url: string, width = 800) {
    return url.replace(
        "/upload/",
        `/upload/w_${width},q_auto:best:sensitive,f_auto/`
    );
}