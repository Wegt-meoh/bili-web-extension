// Block new tab attempts
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
        e.preventDefault();
        window.location.href = link.href;
    }
});