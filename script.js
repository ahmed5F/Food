// متغيرات سلة التسوق
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const DELIVERY_FEE = 5.00; // رسوم توصيل افتراضية (بالدينار العراقي)

// عناصر DOM الأساسية
const cartButton = document.getElementById('cart-button');
const closeCartButton = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.getElementById('cart-count');
const cartSubtotalElement = document.getElementById('cart-subtotal');
const deliveryFeeElement = document.getElementById('delivery-fee');
const cartTotalElement = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-btn');
const bookingForm = document.getElementById('booking-form');
const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const reservationConfirmationModal = document.getElementById('reservation-confirmation-modal');
const backToTopButton = document.getElementById('back-to-top');
const categoryButtons = document.querySelectorAll('.category-btn');
const menuSections = document.querySelectorAll('.menu-section');
const closeModals = document.querySelectorAll('.close-modal');
const header = document.querySelector('header');
const checkoutSpinner = checkoutButton.querySelector('.loading-spinner');
const bookingSpinner = document.getElementById('booking-submit-btn').querySelector('.loading-spinner');


// عناصر مودال تفاصيل الطبق
const addToCartButtons = document.querySelectorAll('.menu-item .add-to-cart'); 
const itemDetailsModal = document.getElementById('item-details-modal');
const modalItemImage = document.getElementById('modal-item-image');
const modalItemName = document.getElementById('modal-item-name');
const modalItemPrice = document.getElementById('modal-item-price');
const modalItemNotes = document.getElementById('modal-item-notes');
const modalItemQuantity = document.getElementById('modal-item-quantity');
const modalQtyMinus = document.getElementById('modal-qty-minus');
const modalQtyPlus = document.getElementById('modal-qty-plus');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');

let currentSelectedItem = null; // لتخزين بيانات الطبق المحدد في المودال

// تحديث السنة في الفوتر
document.getElementById('current-year').textContent = new Date().getFullYear();

// تحديث السلة عند التحميل
updateCart();

// **تأثيرات الهيدر عند التمرير**
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
        backToTopButton.classList.add('visible');
    } else {
        header.classList.remove('scrolled');
        backToTopButton.classList.remove('visible');
    }
});

// فتح/إغلاق سلة التسوق
cartButton.addEventListener('click', () => {
    cartSidebar.classList.add('active');
});

closeCartButton.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
});

// إغلاق أي مودال عند النقر على زر الإغلاق
closeModals.forEach(button => {
    button.addEventListener('click', (event) => {
        const modalId = event.target.getAttribute('data-modal');
        document.getElementById(modalId).classList.remove('active');
    });
});

// إغلاق المودال عند النقر خارج المحتوى
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('confirmation-modal')) {
        event.target.classList.remove('active');
    }
    if (event.target.classList.contains('item-modal')) {
        event.target.classList.remove('active');
    }
});

// تصفية العناصر حسب التصنيف والتمرير السلس
categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // منع سلوك الرابط الافتراضي
        const category = button.getAttribute('data-category');
        
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // إظهار أو إخفاء الأقسام بناءً على التصنيف
        menuSections.forEach(section => {
            const sectionId = section.id.replace('-section', ''); // "appetizers-section" -> "appetizers"
            if (category === 'all' || sectionId === category) {
                section.style.display = 'grid'; // أظهر القسم
            } else {
                section.style.display = 'none'; // أخفِ القسم
            }
        });

        // التمرير إلى القسم المحدد أو إلى بداية قسم القائمة
        const targetSectionId = category === 'all' ? 'menu-content-section' : `${category}-section`;
        document.getElementById(targetSectionId).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});


// فتح مودال تفاصيل الطبق عند النقر على زر "إضافة للسلة"
addToCartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const menuItem = event.target.closest('.menu-item');
        currentSelectedItem = {
            id: menuItem.getAttribute('data-id'),
            name: menuItem.getAttribute('data-name'),
            price: parseFloat(menuItem.getAttribute('data-price')),
            image: menuItem.getAttribute('data-image'),
            description: menuItem.getAttribute('data-description'),
            quantity: 1, 
            notes: '' 
        };

        modalItemImage.src = currentSelectedItem.image;
        modalItemName.textContent = currentSelectedItem.name;
        modalItemPrice.textContent = `${currentSelectedItem.price.toFixed(2)} د.ع`;
        modalItemQuantity.textContent = currentSelectedItem.quantity;
        modalItemNotes.value = ''; 

        itemDetailsModal.classList.add('active');
    });
});

// زيادة/تقليل الكمية في مودال تفاصيل الطبق
modalQtyMinus.addEventListener('click', () => {
    if (currentSelectedItem.quantity > 1) {
        currentSelectedItem.quantity--;
        modalItemQuantity.textContent = currentSelectedItem.quantity;
    }
});

modalQtyPlus.addEventListener('click', () => {
    currentSelectedItem.quantity++;
    modalItemQuantity.textContent = currentSelectedItem.quantity;
});

// إضافة الطبق من المودال إلى السلة
modalAddToCartBtn.addEventListener('click', () => {
    currentSelectedItem.notes = modalItemNotes.value.trim(); 

    // دالة للمقارنة بين العناصر بما في ذلك الملاحظات
    const findCartItem = (item, id, notes) => item.id === id && item.notes === notes;

    const existingItemIndex = cart.findIndex(item => 
        findCartItem(item, currentSelectedItem.id, currentSelectedItem.notes)
    );

    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += currentSelectedItem.quantity;
    } else {
        cart.push({ ...currentSelectedItem }); 
    }

    updateCart();
    showCartNotification(currentSelectedItem.name);
    localStorage.setItem('cart', JSON.stringify(cart));
    itemDetailsModal.classList.remove('active'); 
});

// تحديث السلة
function updateCart() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; margin-top: 50px; color: #777;">السلة فارغة</p>';
    } else {
        cart.forEach(item => {
            subtotal += item.price * item.quantity;

            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)} د.ع</div>
                    ${item.notes ? `<div class="cart-item-options">ملاحظات: ${item.notes}</div>` : ''}
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}" data-notes="${item.notes}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}" data-notes="${item.notes}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}" data-notes="${item.notes}">×</button>
            `;

            cartItemsContainer.appendChild(cartItemElement);
        });
    }

    const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = totalItemsInCart;
    cartSubtotalElement.textContent = subtotal.toFixed(2);
    deliveryFeeElement.textContent = DELIVERY_FEE.toFixed(2);
    cartTotalElement.textContent = (subtotal + DELIVERY_FEE).toFixed(2);

    // إضافة أحداث للأزرار الجديدة (زيادة/تقليل/حذف)
    // نستخدم Event Delegation لضمان عمل الأزرار المضافة ديناميكيًا
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('minus') || target.classList.contains('plus') || target.classList.contains('remove-item')) {
            const id = target.getAttribute('data-id');
            const notes = target.getAttribute('data-notes');
            const itemIndex = cart.findIndex(item => item.id === id && item.notes === notes);

            if (itemIndex === -1) return; // العنصر غير موجود

            if (target.classList.contains('minus')) {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity -= 1;
                } else {
                    cart.splice(itemIndex, 1); 
                }
            } else if (target.classList.contains('plus')) {
                cart[itemIndex].quantity += 1;
            } else if (target.classList.contains('remove-item')) {
                cart.splice(itemIndex, 1);
            }
            
            updateCart();
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    });
}

// إشعار عند إضافة عنصر للسلة
function showCartNotification(itemName) {
    const notification = document.createElement('div');
    notification.className = 'notification fade-in success'; 
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>تمت إضافة ${itemName} إلى السلة بنجاح!</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// تأكيد الطلب
checkoutButton.addEventListener('click', async () => {
    if (cart.length === 0) {
        showNotification('السلة فارغة! الرجاء إضافة بعض العناصر أولاً.', 'error');
        return;
    }

    checkoutSpinner.style.display = 'block'; // إظهار اللودر
    checkoutButton.disabled = true; // تعطيل الزر لمنع الضغط المتعدد

    try {
        // عرض ملخص الطلب في المودال
        const orderSummaryList = document.getElementById('order-summary-list');
        orderSummaryList.innerHTML = '';
        let orderSubtotal = 0;
        cart.forEach(item => {
            const listItem = document.createElement('li');
            const itemTotal = item.price * item.quantity;
            orderSubtotal += itemTotal;
            listItem.innerHTML = `
                <strong>${item.name}</strong> 
                <span>${item.quantity} x ${item.price.toFixed(2)} د.ع = ${itemTotal.toFixed(2)} د.ع</span>
            `;
            if (item.notes) {
                listItem.innerHTML += `<br><small style="margin-right: 20px;">ملاحظات: ${item.notes}</small>`;
            }
            orderSummaryList.appendChild(listItem);
        });

        const deliveryFee = DELIVERY_FEE; 
        const finalTotal = orderSubtotal + deliveryFee;

        const subtotalRow = document.createElement('li');
        subtotalRow.innerHTML = `<strong>المجموع الفرعي:</strong> <span>${orderSubtotal.toFixed(2)} د.ع</span>`;
        orderSummaryList.appendChild(subtotalRow);

        const deliveryFeeRow = document.createElement('li');
        deliveryFeeRow.innerHTML = `<strong>رسوم التوصيل:</strong> <span>${deliveryFee.toFixed(2)} د.ع</span>`;
        orderSummaryList.appendChild(deliveryFeeRow);

        document.getElementById('order-summary-total-modal').textContent = `المجموع الكلي: ${finalTotal.toFixed(2)} د.ع`;
        
        await sendOrderToTelegram(finalTotal);

        orderConfirmationModal.classList.add('active');
        cartSidebar.classList.remove('active');

        // تفريغ السلة بعد التأكيد
        cart = [];
        updateCart();
        localStorage.removeItem('cart');

    } catch (error) {
        console.error('خطأ في عملية تأكيد الطلب:', error);
        showNotification('حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة لاحقاً.', 'error');
    } finally {
        checkoutSpinner.style.display = 'none'; // إخفاء اللودر
        checkoutButton.disabled = false; // تفعيل الزر مرة أخرى
    }
});

// إرسال الطلب إلى تلغرام
async function sendOrderToTelegram(finalTotal) {
    // **ملاحظة مهمة:** استبدل هذه القيم بتوكن البوت ومعرف الدردشة الخاص بك.
    // في بيئة الإنتاج، يجب أن يتم هذا الطلب عبر خادم (Backend)
    // لحماية Bot Token الخاص بك. هذا الكود هو لغرض العرض والتطوير فقط.
    const botToken = '7327398119:AAG2PDQ9ucODYI0Yv7c7WcwNBhNOoba6TrA'; 
    const chatId = '909090929'; 

    let orderMessage = '🍽️ *طلب جديد من موقع مطعم الفارس الذهبي* 🍽️\n\n';
    orderMessage += '📋 *تفاصيل الطلب:*\n';

    if (cart.length === 0) {
        orderMessage += "لا توجد عناصر في السلة."; // في حال كانت السلة فارغة بالخطأ
    } else {
        cart.forEach(item => {
            orderMessage += `- *${item.name}* (${item.quantity} x ${item.price.toFixed(2)} د.ع) = ${(item.quantity * item.price).toFixed(2)} د.ع\n`;
            if (item.notes) {
                orderMessage += `  _ملاحظات:_ ${item.notes}\n`;
            }
        });
    }

    orderMessage += `\n*خدمة التوصيل:* ${DELIVERY_FEE.toFixed(2)} د.ع`;
    orderMessage += `\n💰 *المجموع الكلي:* ${finalTotal.toFixed(2)} د.ع`;
    orderMessage += `\n\n_يرجى التواصل مع العميل لتأكيد الطلب._`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: orderMessage,
            parse_mode: 'Markdown'
        })
    });

    const data = await response.json();
    console.log('تم إرسال الطلب:', data);
    if (!data.ok) {
        throw new Error(`خطأ من تلغرام: ${data.description}`);
    }
}

// تأكيد الحجز (إرسال إلى تلغرام أيضاً)
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    bookingSpinner.style.display = 'block'; // إظهار اللودر
    document.getElementById('booking-submit-btn').disabled = true; // تعطيل الزر

    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('booking-notes').value.trim() // تم تغيير ID الملاحظات هنا
    };
    
    try {
        // عرض ملخص الحجز في المودال
        const reservationSummaryList = document.getElementById('reservation-summary-list');
        reservationSummaryList.innerHTML = `
            <li><strong>الاسم:</strong> <span>${formData.name}</span></li>
            <li><strong>رقم الهاتف:</strong> <span>${formData.phone}</span></li>
            <li><strong>تاريخ الحجز:</strong> <span>${formData.date}</span></li>
            <li><strong>وقت الحجز:</strong> <span>${formData.time}</span></li>
            <li><strong>عدد الأشخاص:</strong> <span>${formData.guests}</span></li>
            ${formData.notes ? `<li><strong>ملاحظات:</strong> <span>${formData.notes}</span></li>` : ''}
        `;

        await sendBookingToTelegram(formData);
        
        reservationConfirmationModal.classList.add('active');
        bookingForm.reset(); 

    } catch (error) {
        console.error('خطأ في عملية تأكيد الحجز:', error);
        showNotification('حدث خطأ أثناء تأكيد الحجز، يرجى المحاولة لاحقاً.', 'error');
    } finally {
        bookingSpinner.style.display = 'none'; // إخفاء اللودر
        document.getElementById('booking-submit-btn').disabled = false; // تفعيل الزر
    }
});

// إرسال الحجز إلى تلغرام
async function sendBookingToTelegram(bookingData) {
    // **ملاحظة مهمة:** استبدل هذه القيم بتوكن البوت ومعرف الدردشة الخاص بك.
    // في بيئة الإنتاج، يجب أن يتم هذا الطلب عبر خادم (Backend)
    // لحماية Bot Token الخاص بك. هذا الكود هو لغرض العرض والتطوير فقط.
    const botToken = '7327398119:AAG2PDQ9ucODYI0Yv7c7WcwNBhNOoba6TrA'; 
    const chatId = '909090929'; 

    let bookingMessage = '📅 *حجز طاولة جديد في مطعم الفارس الذهبي* 📅\n\n';
    bookingMessage += `👤 *الاسم:* ${bookingData.name}\n`;
    bookingMessage += `📞 *رقم الهاتف:* ${bookingData.phone}\n`;
    bookingMessage += `🗓️ *التاريخ:* ${bookingData.date}\n`;
    bookingMessage += `⏰ *الوقت:* ${bookingData.time}\n`;
    bookingMessage += `👥 *عدد الأشخاص:* ${bookingData.guests}\n`;
    if (bookingData.notes) {
        bookingMessage += `📝 *ملاحظات:* ${bookingData.notes}\n`;
    }
    bookingMessage += `\n_يرجى التواصل مع العميل لتأكيد الحجز._`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: bookingMessage,
            parse_mode: 'Markdown'
        })
    });

    const data = await response.json();
    console.log('تم إرسال الحجز:', data);
    if (!data.ok) {
        throw new Error(`خطأ من تلغرام: ${data.description}`);
    }
}

// زر العودة للأعلى
backToTopButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// عرض الإشعارات (تنبيهات قصيرة)
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification fade-in ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// إضافة تأثيرات للعناصر عند التمرير
const fadeElements = document.querySelectorAll('.menu-item, .reservation-section');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(element => {
    fadeObserver.observe(element);
});
