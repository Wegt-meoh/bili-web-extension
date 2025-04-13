export function modifyNavigation() {
    // Block new tab attempts
    document.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
            return;
        }
        const link = e.target.closest('a');
        if (!link) return;

        if (link.target === '_blank') {
            e.preventDefault();
            window.location.href = link.href;
        }
    });
}
