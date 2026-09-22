$(document).ready(function () {
    const todoInput = document.getElementById('todo-input');
    const todoDate = document.getElementById('todo-date');
    const todoList = document.getElementById('todo-list');

    const quoteCategories = [
        { name: 'Excellence', terms: ['excellence', 'quality', 'greatness', 'best'] },
        { name: 'Work', terms: ['work', 'working', 'effort', 'career', 'success'] },
        { name: 'Dreams', terms: ['dream', 'dreams', 'imagination', 'hope', 'vision'] },
        { name: 'Change', terms: ['change', 'changing', 'transform', 'growth', 'different'] },
        { name: 'Time', terms: ['time', 'moment', 'today', 'tomorrow', 'future'] },
        { name: 'Life', terms: ['life', 'live', 'living', 'death', 'love'] }
    ];

    let quotePool = [];
    let categoryIndex = 0;

    loadQuotes();

    function loadQuotes() {
        // Local backup pool to bypass the Techloq web filter block
        const fallbackQuotes = [
            { q: "Quality is not an act, it is a habit.", a: "Aristotle" },
            { q: "A small step every day still moves you forward.", a: "Your future self" },
            { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
            { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
            { q: "Change your thoughts and you change your world.", a: "Norman Vincent Peale" }
        ];

        // REQUIREMENT B: Utilizing jQuery native AJAX method to pull the endpoint
        $.ajax({
            url: 'https://allorigins.win',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                // REQUIREMENT C: Parse JSON data on success
                quotePool = data;
                startQuoteRotator();
            },
            error: function (xhr, status, error) {
                // REQUIREMENT B: Handle AJAX errors gracefully providing fallback feedback
                console.warn("API blocked by Techloq filter. Activating jQuery local backup pool.");
                quotePool = fallbackQuotes;
                startQuoteRotator();
            }
        });

        function startQuoteRotator() {
            displayNextQuote();
            window.setInterval(displayNextQuote, 10000);
        }
    }

    function displayNextQuote() {
        if (!quotePool.length) return;

        const category = quoteCategories[categoryIndex];
        const matchingQuotes = quotePool.filter((quote) => {
            const searchableText = `${quote.q} ${quote.a}`.toLowerCase();
            return category.terms.some((term) => searchableText.includes(term));
        });
        const availableQuotes = matchingQuotes.length ? matchingQuotes : quotePool;
        const quote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];

        $('#quote-category').text(category.name);
        $('#quote-text').text(`“${quote.q}”`);
        $('#quote-author').text(quote.a);
        categoryIndex = (categoryIndex + 1) % quoteCategories.length;
    }

    // Initialize Slick Carousel
    $('.my-slider-wrapper').slick({
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000,
        speed: 300,
        slidesToShow: 1,
        arrows: true
    });

    // Requirement A: Handle click event using jQuery and perform validation
    $('#add-button').on('click', function () {
        const taskText = $('#todo-input').val().trim();
        const dateValue = $('#todo-date').val();

        // 1. Get today's local date details set cleanly to midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Parse the input value split by dashes to keep it completely local
        let selectedDate = null;
        if (dateValue) {
            const parts = dateValue.split('-'); // splits 'YYYY-MM-DD'
            // [0] = Year, [1] = Month (0-indexed), [2] = Day
            selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }

        // 3. Validation Logic Check
        if (taskText === "" || !dateValue || selectedDate < today) {
            // Requirement C: Modify CSS class to turn button red if validation fails
            $(this).removeClass('valid-state').addClass('invalid-state');

            // Highlight empty or invalid inputs
            if (taskText === "") $('#todo-input').css('border-color', '#ef4444');
            if (!dateValue || selectedDate < today) $('#todo-date').css('border-color', '#ef4444');
            return;
        }

        // Requirement C: Reset UI styles if validation passes
        $(this).removeClass('invalid-state').addClass('valid-state');
        $('#todo-input, #todo-date').css('border-color', '#38bdf8');

        // Create the task since everything is valid!
        createTask(taskText, dateValue);
    });

    // Clear error borders as soon as the user starts correcting data
    $('#todo-input, #todo-date').on('input change', function () {
        $(this).css('border-color', '#38bdf8');
        $('#add-button').removeClass('invalid-state valid-state');
    });

    function createTask(task, dateString) {
        const taskId = 'task-' + Date.now();

        // Format date string beautifully (MM/DD)
        const parts = dateString.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formattedDate = (dateObj.getMonth() + 1) + '/' + dateObj.getDate();

        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-id', taskId);

        const textSpan = document.createElement("span");
        textSpan.innerHTML = `${task} <small style="color: #94a3b8; font-size: 0.85rem; margin-left: 10px;">(Due: ${formattedDate})</small>`;

        // DONE BUTTON
        const doneButton = document.createElement('button');
        doneButton.textContent = '✓';
        doneButton.className = 'done-button';
        doneButton.addEventListener('click', () => {
            $(textSpan).html(`<del>${task}</del> <small style="color: #94a3b8; font-size: 0.85rem; margin-left: 10px;">(Due: ${formattedDate})</small>`);
            // Add the dynamic glow class to the card list item
            $(taskItem).addClass('completed-glow');

            // Target the specific matching carousel slide element and apply the glow class
            const carouselHeading = $(`.my-slider-wrapper [data-carousel-id="${taskId}"] h3`);
            carouselHeading.html(`<del>${task} (${formattedDate})</del>`);
            $(`.my-slider-wrapper [data-carousel-id="${taskId}"]`).addClass('completed-glow');
        });

        // DELETE BUTTON
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => {
            removeSlideFromCarousel(taskId);
            todoList.removeChild(taskItem);
        });

        // STAR BUTTON
        const starButton = document.createElement('button');
        starButton.textContent = '☆';
        starButton.className = 'star-button';
        starButton.addEventListener('click', () => {
            starButton.classList.toggle('starred');

            if (starButton.classList.contains('starred')) {
                starButton.textContent = '★';

                // Keep the cross-out structure if it was already checked off before starring
                //const isCrossedOut = textSpan.style.textDecoration === 'line-through' ? 'style="text-decoration: line-through;"' : '';
                const isCrossedOut = $(textSpan).find('del').length > 0 ? 'style="text-decoration: line-through;"' : '';
                const isGlowing = $(taskItem).hasClass('completed-glow') ? 'completed-glow' : '';

                addSlideToCarousel(`${task} (${formattedDate})`, taskId, isCrossedOut, isGlowing);
            } else {
                starButton.textContent = '☆';
                removeSlideFromCarousel(taskId);
            }
        });

        taskItem.appendChild(textSpan);
        taskItem.appendChild(doneButton);
        taskItem.appendChild(deleteButton);
        taskItem.appendChild(starButton);
        todoList.appendChild(taskItem);

        // Clear entry items
        todoInput.value = '';
        $('#todo-date').val('');
    }

    function addSlideToCarousel(text, id, styleAttribute, glowClass) {
        const slideHTML = `<div class="slide-item ${glowClass}" data-carousel-id="${id}"><h3 ${styleAttribute}>${text}</h3></div>`;
        $('.my-slider-wrapper').slick('slickAdd', slideHTML);
    }

    function removeSlideFromCarousel(id) {
        const slideIndex = $('.my-slider-wrapper .slide-item').filter(function () {
            return $(this).attr('data-carousel-id') === id;
        }).index();

        if (slideIndex !== -1) {
            $('.my-slider-wrapper').slick('slickRemove', slideIndex);
        }
    }
});