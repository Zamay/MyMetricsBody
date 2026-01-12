// ==UserScript==
// @name        Instagram Focus Mode v13 (Max Performance)
// @match       https://www.instagram.com/*
// @version     13.0
// @run-at      document-start
// ==/UserScript==

(function() {
    'use strict';

    // 1. CSS (Nuclear Option - Залишаємо як було, це найкращий варіант)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Блокуємо скрол на головній (перебиваємо всі стилі Instagram) */
        html body.page-home, 
        html._ar44 body.page-home._ar45 { 
            overflow: hidden !important; 
            overflow-y: hidden !important;
            position: fixed !important; 
            width: 100% !important;
            height: 100% !important;
            top: 0 !important;
        }

        /* Навігація */
        div[data-visualcompletion="ignore-dynamic"] > div:nth-child(2),
        div[data-visualcompletion="ignore-dynamic"] > div:nth-child(3) { 
            display: none !important; 
        }
        
        /* Чат */
        body.page-inbox h3 { display: none !important; }
    `;
    document.head.appendChild(style);

    // Змінна для кешування поточної адреси
    let lastUrl = "";

    // 2. Main Logic
    function optimizePage() {
        // Отримуємо поточний шлях
        const currentPath = window.location.pathname;

        // --- ЕТАП 1: Перевірка зміни сторінки ---
        // Якщо URL змінився, робимо повну перечистку класів
        if (currentPath !== lastUrl) {
            lastUrl = currentPath;
            document.body.classList.remove('page-home', 'page-inbox', 'page-profile');
            
            if (currentPath === '/' || currentPath === '') {
                document.body.classList.add('page-home');
                // Примусовий стиль (один раз при вході)
                document.body.style.setProperty('overflow', 'hidden', 'important');
                document.body.style.setProperty('position', 'fixed', 'important');
            } else if (currentPath.startsWith('/direct/inbox/')) {
                document.body.classList.add('page-inbox');
                document.body.style.overflow = ''; 
                document.body.style.position = '';
            } else {
                document.body.classList.add('page-profile');
                document.body.style.overflow = ''; 
                document.body.style.position = '';
            }
        }

        // --- ЕТАП 2: Легкі операції (виконуються постійно) ---
        
        // 1. Якщо ми на головній - перевіряємо, чи на місці наш Dashboard
        if (currentPath === '/' || currentPath === '') {
            // Перевірка дуже швидка: якщо елемент є, ми нічого не робимо
            if (!document.getElementById('focus-dashboard')) {
                injectDashboard();
            }
        }
        
        // 2. Якщо ми в чаті - видаляємо нотатки (Твій швидкий метод)
        if (currentPath.startsWith('/direct/inbox/')) {
            const nav = document.querySelector('div[role="navigation"]');
            // ?. рятує від помилок. Якщо нотатки вже display: none, браузер це ігнорує (швидко)
            const notes = nav?.getElementsByTagName('div')[0]?.children[3]?.children[0];
            if (notes && notes.style.display !== 'none') {
                 notes.style.display = 'none';
            }
        }
    }

    // 3. Створення Dashboard (тільки коли треба)
    function injectDashboard() {
        const firstArticle = document.querySelector('article');
        if (!firstArticle) return; // Ще не завантажився

        // Стилізуємо сам article
        firstArticle.style.position = 'relative';
        firstArticle.style.minHeight = '80vh';
        firstArticle.style.marginBottom = '0';
        
        // Створюємо наш блок
        const myDiv = document.createElement('div');
        myDiv.id = 'focus-dashboard'; // ID для швидкого пошуку
        
        // Всі стилі одним рядком для швидкості
        myDiv.style.cssText = 'width:100%; height:100%; position:absolute; top:0; left:0; background-color:#248686; z-index:1; display:flex; justify-content:center; align-items:center;';
        
        myDiv.innerHTML = '<span style="color:white; font-family:-apple-system, sans-serif; font-size:24px; font-weight:600;">Продуктивного дня! ✨</span>';
        
        firstArticle.appendChild(myDiv);
        
        // Ховаємо сусідів (один раз)
        let sibling = firstArticle.nextElementSibling;
        while (sibling) {
            if (sibling.tagName === 'ARTICLE') sibling.style.display = 'none';
            sibling = sibling.nextElementSibling;
        }
    }

    // 4. Observer
    // Ми використовуємо його, щоб ловити момент, коли Інстаграм підвантажує контент (SPA)
    const observer = new MutationObserver(() => {
        // Ми не запускаємо тут важких циклів, просто викликаємо функцію
        optimizePage();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Interval можна забрати, або залишити як "страховку" раз на секунду (рідше)
    // Observer-а зазвичай достатньо для SPA
    // setInterval(optimizePage, 1000); 

})();