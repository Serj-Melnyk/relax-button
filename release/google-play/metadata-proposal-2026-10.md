# Пропозиція: нова сторінка в Google Play (жовтень 2026)

Мета: щоб застосунок знаходили за тим, що люди реально шукають (brown noise, white noise, sleep sounds, rain), а кнопку-фіджет подати як фішку, а не як єдину суть.

Поточний текст — у `metadata.md`. Ця пропозиція його не замінює, доки її не погоджено.

## Назва (до 30 символів)

| Варіант | Символів | Коментар |
|---|---|---|
| **Digital Fidget: Noise & ASMR** | 28 | Рекомендую: бренд + обидві частини продукту |
| Digital Fidget: Brown Noise | 27 | Найсильніше пошукове слово, але звужує |
| Digital Fidget: Sleep & Focus | 29 | Про користь, а не про звуки |

Українська: **Digital Fidget: шуми й ASMR** (27)

## Короткий опис (до 80 символів)

en-US:
> Brown, white & pink noise, rain and ASMR clicks. No ads. No subscription.

uk:
> Коричневий, білий і рожевий шум, дощ та ASMR-кліки. Без реклами й підписок.

## Повний опис — en-US

Press. Listen. Breathe.

Digital Fidget is a calm, beautiful noise player with a tactile button you will want to keep pressing. Put on brown noise to fall asleep, pink noise to focus, rain to unwind, or tap the button for a quick satisfying click when your mind is racing.

No ads. No subscription. No account. Just open it and press play.

SLEEP, FOCUS AND CALM
• Brown noise – deep and soft, for sleep and shutting out the world
• White noise – bright and steady, masks voices and street sounds
• Pink noise – balanced and gentle, for reading, studying and writing
• Orange and deep low-frequency noise – warm, spacious textures
• Rain, thunder, waterfall and birds – familiar sounds of nature
• People – the soft murmur of a café or a crowd, for when silence feels too loud
• Sleep timer – the sound fades out on its own

A BUTTON FOR RESTLESS HANDS
• Over 20 satisfying clicks: switches, buttons, glass, finger snaps and sci-fi sounds
• Gentle native vibration with every press
• Beautiful button skins, from a wooden button by candlelight to the Moon in a starry sky

MADE WITH CARE
• Day and night themes, designed for dark bedrooms
• Every noise is checked with spectral analysis, so its colour is real, not just a label
• Sounds loop seamlessly and keep playing in the background
• Works offline

FAIR PRICING
Try everything free for 3 days. After that, the classic click button and the Day and Night themes stay free forever, and a single one-time Premium purchase keeps every noise, skin and sound unlocked. No subscriptions, no ads, no tracking.

Digital Fidget is designed for relaxation and everyday calm. It is not a medical device.

## Повний опис — uk

Натисни. Послухай. Видихни.

Digital Fidget — гарний спокійний плеєр шумів із тактильною кнопкою, яку хочеться натискати знову й знову. Увімкни коричневий шум, щоб заснути, рожевий — щоб зосередитися, дощ — щоб відпочити, або просто натисни кнопку, коли думки не дають спокою.

Без реклами. Без підписки. Без акаунта. Відкрив — і слухаєш.

СОН, ФОКУС І СПОКІЙ
• Коричневий шум — глибокий і м'який, для сну й тиші навколо
• Білий шум — рівний і яскравий, приглушує голоси й вуличний шум
• Рожевий шум — збалансований і ніжний, для читання, навчання й роботи
• Помаранчевий і глибокий низькочастотний шум — теплі, просторі текстури
• Дощ, гроза, водоспад і пташки — знайомі звуки природи
• People — тихий гомін кав'ярні чи натовпу, коли тиша надто гучна
• Таймер сну — звук згасне сам

КНОПКА ДЛЯ НЕСПОКІЙНИХ РУК
• Понад 20 приємних кліків: перемикачі, кнопки, скло, клацання пальцями й космічні звуки
• Легка вібрація з кожним натисканням
• Гарні скіни кнопки — від дерев'яної кнопки при свічці до Місяця на зоряному небі

ЗРОБЛЕНО З ТУРБОТОЮ
• Денна й нічна теми, створені для темної спальні
• Кожен шум перевірено спектральним аналізом — його колір справжній, а не просто назва
• Звуки зациклюються без пауз і грають у фоні
• Працює без інтернету

ЧЕСНА ЦІНА
Усе доступно безкоштовно перші 3 дні. Потім класична кнопка-клікер і денна та нічна теми лишаються безкоштовними назавжди, а одна одноразова покупка Premium відкриває всі шуми, скіни й звуки. Без підписок, реклами й стеження.

Digital Fidget створено для відпочинку й щоденного спокою. Це не медичний виріб.

## Що змінено і чому

- Головне — шуми для сну й фокусу; кнопка-фіджет — друга перевага, а не єдина.
- Прибрано технічний абзац про FFT, метод Велча й регресію: замість нього одне речення про спектральний аналіз.
- «Infrared noise» описано як «deep low-frequency noise»: так зрозуміліше й не звучить як псевдонаука. Назву скіна в застосунку можна лишити.
- Додано People, таймер сну, офлайн-режим і фонове відтворення — те, що є в застосунку, але не було в описі.
- «No ads. No subscription.» винесено в короткий опис: це головна відмінність від конкурентів.

## Перед публікацією перевірити

- Що застосунок справді працює офлайн і грає у фоні з вимкненим екраном (у коді є `NoisePlaybackService` і локальні файли, але варто перевірити на телефоні).
- **Важливо: після 3-денного пробного періоду безкоштовні лише скін Click, звук `classic-click` і теми Classic/Night** (`ACCESS_DEFAULTS` у `www/index.html`). Усі шуми, дощ, Moon і People — Premium. Текст про ціну написано саме так. Але якщо сторінка продає застосунок як плеєр шумів, а після 3 днів шуми закриваються, будуть негативні відгуки. Варто подумати, чи не зробити 1–2 шуми безкоштовними назавжди (наприклад, білий і коричневий) — це продуктове рішення, не текстове.
- Перший скриншот варто зробити з екраном шумів або Moon, а не тільки з кнопкою.
- Інші 5 мов сторінки (de, es, fr, ja, pt-BR) перекласти після погодження англійського тексту.
