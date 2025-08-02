document.addEventListener('DOMContentLoaded', () => {
    const menuBars = document.getElementById('menu-bars');
    const dropdownContent = document.getElementById('dropdown-content');

    menuBars.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
    });

    // Close the dropdown if the user clicks outside of it
    menuBars.addEventListener('click', (event) => {
        if (!event.target.matches('.dropbtn') && !event.target.closest('.dropdown')) {
            dropdownContent.classList.remove('show');
        }
    });
});
