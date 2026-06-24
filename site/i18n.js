const SITE_LANGS = ['en', 'ja', 'fr', 'de', 'es', 'pt', 'uk'];

const SITE_TEXT = {
  en: {
    name: 'English',
    nav: ['Privacy', 'Terms', 'Support'],
    landing: {
      title: 'Digital Fidget: Mental ASMR - Press. Listen. Reset.',
      eyebrow: 'A small tactile ritual',
      h1: 'Press.<br>Listen.<br>Reset.',
      lead: 'A quiet wellness button for overstimulated moments. Feel a gentle haptic, hear a satisfying click, and take a short focus break.',
      store: 'Coming soon to',
      features: [
        ['Tactile by design', 'Live ASMR sound and native haptics make each press feel deliberate and grounded.'],
        ['The core is free', 'Classic Click plus Classic and Night themes are always available. Premium unlocks the additional themes, sounds, and skins.'],
        ['Private and focused', 'No ads, no account required, and no behavioral analytics in the app.']
      ],
      analysis: {
        kicker: 'Noise verification',
        title: 'Our noise labels are checked, not guessed.',
        lead: 'To classify and verify each noise color, we analyze the power spectral density of the source audio and measure how energy decays across frequencies.',
        items: [
          ['Spectral method', 'We use Welch averaging across FFT frames, then fit the spectrum in logarithmic coordinates to estimate the slope coefficient alpha that defines the noise color.'],
          ['Model confidence', 'We also track the R squared fit score to confirm that the measured spectrum actually matches the expected noise model with high confidence.']
        ]
      }
    },
    pages: {
      privacy: {
        updated: 'Effective June 10, 2026',
        h1: 'Privacy Policy',
        intro: 'Digital Fidget: Mental ASMR works without an account, advertising, or behavioral analytics. This policy explains the limited information involved when you use the app or make a purchase.',
        sections: [
          ['Information stored on your device', 'The app stores your selected theme, sound, button position, onboarding status, and sound or vibration preferences locally on your device. We do not receive this information.'],
          ['Purchases', 'Premium is a lifetime in-app purchase processed by Apple App Store or Google Play. We do not receive or store your full payment-card details.'],
          ['Receipt validation', 'If server-side receipt validation is enabled, purchase receipt data and limited technical metadata may be processed only to verify purchases, prevent fraud, and provide support.'],
          ['Analytics, advertising, and tracking', 'The released app does not include advertising SDKs, cross-app tracking, or behavioral analytics. We do not sell personal information.'],
          ['Service providers', 'Apple and Google process store purchases under their own privacy policies. If enabled, Iaptic and Google Cloud may help validate purchases.'],
          ['Retention', 'Local preferences remain on your device until you clear app data or uninstall the app. Store purchase records are retained by Apple or Google according to their policies.'],
          ['Children', 'Digital Fidget: Mental ASMR is a general-audience wellbeing utility and is not directed to children under 13.'],
          ['Your choices and rights', 'You can reset local preferences by clearing app data or uninstalling the app. Store purchase records are managed through your Apple or Google account.'],
          ['Contact', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']
        ]
      },
      terms: {
        updated: 'Effective June 10, 2026',
        h1: 'Terms of Use',
        intro: 'By using Digital Fidget: Mental ASMR, you agree to these terms. If you do not agree, do not use the app.',
        sections: [
          ['The service', 'The app provides sounds, visual themes, and haptic feedback for general relaxation and entertainment. It is not a medical device.'],
          ['Premium purchase', 'Premium is a non-consumable lifetime purchase for the Apple or Google account used to buy it.'],
          ['Payments and refunds', 'Apple or Google processes payments. Refunds and disputes are governed by the applicable store terms.'],
          ['Acceptable use', 'Use the app for personal, lawful purposes. Do not interfere with verification, redistribute paid assets, or violate another person’s rights.'],
          ['Availability', 'We may improve, update, or discontinue parts of the app. Restore availability can depend on Apple, Google, device compatibility, and network services.'],
          ['Disclaimer and liability', 'The app is provided “as is” to the extent permitted by law. Nothing limits rights that cannot legally be limited.'],
          ['Contact', 'Questions can be sent to <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']
        ]
      },
      support: {
        updated: 'Digital Fidget: Mental ASMR Support',
        h1: 'How can we help?',
        intro: '',
        sections: [
          ['Restore Premium', 'Open the app, open Customize, choose Premium, and tap Restore Purchase. Use the same Apple ID or Google account that made the original purchase.'],
          ['Sound or vibration is unavailable', 'Open Settings and confirm Sound and Vibration are enabled. Also check device volume, silent mode, and system haptic settings.'],
          ['A purchase is pending', 'Some store transactions require approval or extra processing. Wait for store confirmation, reopen the app, and use Restore Purchase.'],
          ['Contact support', 'Include your device model, OS version, app version, and a short description. Never email payment-card details or passwords.']
        ],
        email: 'Email support'
      }
    }
  }
};

Object.assign(SITE_TEXT, {
  uk: { ...SITE_TEXT.en, name: 'Українська', nav: ['Приватність', 'Умови', 'Підтримка'],
    landing: { title: 'Digital Fidget: Mental ASMR - Натисни. Послухай. Видихни.', eyebrow: 'Маленький тактильний ритуал', h1: 'Натисни.<br>Послухай.<br>Видихни.', lead: 'Тиха wellness-кнопка для перевантажених моментів. Відчуй м’який haptic, почуй приємний клік і зроби коротку паузу для фокусу.', store: 'Скоро в', features: [['Тактильність у центрі', 'Живий ASMR-звук та нативний хаптік роблять кожне натискання чітким і заземленим.'], ['Основа безкоштовна', 'Classic Click, Classic і Night доступні завжди. Premium відкриває додаткові теми, звуки й скіни.'], ['Приватно й сфокусовано', 'Без реклами, без акаунта і без поведінкової аналітики в застосунку.']], analysis: { kicker: 'Верифікація шуму', title: 'Наші назви шумів перевіряються, а не вгадуються.', lead: 'Щоб класифікувати й верифікувати кожен колір шуму, ми аналізуємо спектральну щільність потужності вихідного аудіо та вимірюємо, як енергія спадає по частотах.', items: [['Спектральний метод', 'Ми використовуємо метод Велча з усередненням FFT-фреймів, а потім апроксимуємо спектр у логарифмічних координатах, щоб оцінити показник схилу alpha, який визначає колір шуму.'], ['Надійність моделі', 'Додатково ми відстежуємо показник відповідності R squared, щоб підтвердити, що виміряний спектр справді з високою точністю відповідає очікуваній моделі шуму.']] } },
    pages: {
      privacy: { updated: 'Чинна з 10 червня 2026', h1: 'Політика приватності', intro: 'Digital Fidget: Mental ASMR працює без акаунта, реклами й поведінкової аналітики. Тут описано мінімальні дані, пов’язані з використанням застосунку та покупками.', sections: [['Дані на пристрої', 'Обрана тема, звук, позиція кнопки, онбординг і налаштування звуку/вібрації зберігаються локально. Ми їх не отримуємо.'], ['Покупки', 'Premium є lifetime-покупкою через App Store або Google Play. Ми не отримуємо повні дані платіжної картки.'], ['Перевірка квитанцій', 'Якщо увімкнено серверну перевірку, квитанція й обмежені технічні дані можуть оброблятися лише для підтвердження покупки, захисту від шахрайства й підтримки.'], ['Аналітика й реклама', 'Релізний застосунок не містить рекламних SDK, cross-app tracking або поведінкової аналітики. Ми не продаємо персональні дані.'], ['Постачальники', 'Apple і Google обробляють покупки за власними політиками. Iaptic і Google Cloud можуть допомагати з перевіркою покупок.'], ['Зберігання', 'Локальні налаштування залишаються на пристрої до очищення даних або видалення застосунку.'], ['Діти', 'Застосунок призначений для широкої аудиторії і не спрямований на дітей до 13 років.'], ['Ваш вибір', 'Можна скинути локальні налаштування, очистивши дані застосунку або видаливши його.'], ['Контакт', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
      terms: { updated: 'Чинні з 10 червня 2026', h1: 'Умови використання', intro: 'Користуючись Digital Fidget: Mental ASMR, ви погоджуєтесь із цими умовами.', sections: [['Сервіс', 'Застосунок надає звуки, теми й haptic-відгук для загального розслаблення та розваги. Це не медичний пристрій.'], ['Premium', 'Premium є lifetime-покупкою для Apple або Google акаунта, з якого її придбано.'], ['Оплати й повернення', 'Оплати обробляє Apple або Google. Повернення регулюються правилами відповідного магазину.'], ['Допустиме використання', 'Використовуйте застосунок особисто й законно. Не втручайтесь у перевірку покупок і не поширюйте платні assets.'], ['Доступність', 'Ми можемо покращувати, оновлювати або змінювати частини застосунку.'], ['Відмова від гарантій', 'Застосунок надається “як є” у межах, дозволених законом.'], ['Контакт', 'Питання надсилайте на <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
      support: { updated: 'Підтримка Digital Fidget: Mental ASMR', h1: 'Чим допомогти?', intro: '', sections: [['Відновити Premium', 'Відкрийте застосунок, Customize, Premium і натисніть Restore Purchase. Використовуйте той самий Apple ID або Google акаунт.'], ['Немає звуку або вібрації', 'Перевірте Sound і Vibration у Settings, гучність пристрою, silent mode і системні haptic-налаштування.'], ['Покупка очікує', 'Деякі транзакції потребують підтвердження. Дочекайтесь магазину, відкрийте застосунок знову й натисніть Restore Purchase.'], ['Зв’язатися з підтримкою', 'Вкажіть модель пристрою, версію OS, версію застосунку й короткий опис проблеми. Не надсилайте дані карток або паролі.']], email: 'Написати в підтримку' }
    }
  }
});

SITE_TEXT.fr = {
  ...SITE_TEXT.en,
  name: 'Français',
  nav: ['Confidentialité', 'Conditions', 'Assistance'],
  landing: { title: 'Digital Fidget: Mental ASMR - Appuie. Écoute. Respire.', eyebrow: 'Un petit rituel tactile', h1: 'Appuie.<br>Écoute.<br>Respire.', lead: 'Un bouton de bien-être discret pour les moments de surcharge. Sens un retour haptique doux, entends un clic satisfaisant et prends une courte pause.', store: 'Bientôt sur', features: [['Pensé pour le toucher', 'Le son ASMR vivant et les haptiques natives rendent chaque pression nette et ancrée.'], ['Le cœur est gratuit', 'Classic Click, les thèmes Classic et Night restent disponibles. Premium ajoute des thèmes, sons et skins.'], ['Privé et concentré', 'Pas de publicité, pas de compte requis et pas d’analyse comportementale.']] },
  pages: {
    privacy: { updated: 'En vigueur le 10 juin 2026', h1: 'Politique de confidentialité', intro: 'Digital Fidget: Mental ASMR fonctionne sans compte, publicité ni analyse comportementale. Cette politique décrit les informations limitées liées à l’app et aux achats.', sections: [['Données sur votre appareil', 'Les préférences de thème, son, position du bouton, onboarding, son et vibration restent stockées localement. Nous ne les recevons pas.'], ['Achats', 'Premium est un achat intégré à vie traité par l’App Store ou Google Play. Nous ne recevons pas les détails complets de votre carte.'], ['Validation des reçus', 'Si elle est activée, la validation serveur peut traiter un reçu et des métadonnées limitées uniquement pour vérifier l’achat, prévenir la fraude et assurer le support.'], ['Analytics et publicité', 'L’app publiée ne contient pas de SDK publicitaire, de suivi inter-apps ni d’analyse comportementale.'], ['Prestataires', 'Apple et Google traitent les achats selon leurs politiques. Iaptic et Google Cloud peuvent aider à valider les achats.'], ['Conservation', 'Les préférences locales restent sur l’appareil jusqu’à suppression des données ou désinstallation.'], ['Enfants', 'L’app est destinée au grand public et ne cible pas les enfants de moins de 13 ans.'], ['Vos choix', 'Vous pouvez réinitialiser les préférences en supprimant les données de l’app ou en la désinstallant.'], ['Contact', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    terms: { updated: 'En vigueur le 10 juin 2026', h1: 'Conditions d’utilisation', intro: 'En utilisant Digital Fidget: Mental ASMR, vous acceptez ces conditions.', sections: [['Le service', 'L’app fournit des sons, thèmes visuels et retours haptiques pour la détente générale et le divertissement. Ce n’est pas un dispositif médical.'], ['Achat Premium', 'Premium est un achat à vie lié au compte Apple ou Google utilisé.'], ['Paiements et remboursements', 'Apple ou Google traite les paiements. Les remboursements suivent les règles du store concerné.'], ['Usage acceptable', 'Utilisez l’app légalement et personnellement. Ne contournez pas la vérification et ne redistribuez pas les contenus payants.'], ['Disponibilité', 'Nous pouvons améliorer, mettre à jour ou modifier certaines parties de l’app.'], ['Responsabilité', 'L’app est fournie “telle quelle” dans les limites autorisées par la loi.'], ['Contact', 'Questions : <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    support: { updated: 'Assistance Digital Fidget: Mental ASMR', h1: 'Comment aider ?', intro: '', sections: [['Restaurer Premium', 'Ouvrez l’app, Customize, Premium, puis Restore Purchase avec le même compte Apple ou Google.'], ['Son ou vibration indisponible', 'Vérifiez Sound et Vibration dans Settings, le volume, le mode silencieux et les réglages haptiques du système.'], ['Achat en attente', 'Certaines transactions demandent une validation. Attendez la confirmation du store puis utilisez Restore Purchase.'], ['Contacter le support', 'Indiquez le modèle, la version OS, la version de l’app et une courte description.']], email: 'Contacter le support' }
  }
};

SITE_TEXT.de = {
  ...SITE_TEXT.fr,
  name: 'Deutsch',
  nav: ['Datenschutz', 'Bedingungen', 'Support'],
  landing: { title: 'Digital Fidget: Mental ASMR - Drücken. Hören. Reset.', eyebrow: 'Ein kleines taktiles Ritual', h1: 'Drücken.<br>Hören.<br>Reset.', lead: 'Ein ruhiger Wellness-Button für überreizte Momente. Spüre sanftes haptisches Feedback, höre einen befriedigenden Klick und mach eine kurze Fokuspause.', store: 'Bald im', features: [['Taktil gestaltet', 'Lebendiger ASMR-Sound und native Haptik machen jeden Druck klar und geerdet.'], ['Der Kern ist kostenlos', 'Classic Click sowie Classic und Night bleiben verfügbar. Premium schaltet weitere Themes, Sounds und Skins frei.'], ['Privat und fokussiert', 'Keine Werbung, kein Konto und keine Verhaltensanalyse in der App.']] },
  pages: {
    privacy: { updated: 'Gültig ab 10. Juni 2026', h1: 'Datenschutzerklärung', intro: 'Digital Fidget: Mental ASMR funktioniert ohne Konto, Werbung oder Verhaltensanalyse. Diese Erklärung beschreibt die wenigen Daten, die bei Nutzung und Käufen eine Rolle spielen.', sections: [['Daten auf deinem Gerät', 'Theme, Sound, Button-Position, Onboarding sowie Sound- und Vibrationsoptionen bleiben lokal auf deinem Gerät. Wir erhalten diese Daten nicht.'], ['Käufe', 'Premium ist ein lebenslanger In-App-Kauf über App Store oder Google Play. Wir erhalten keine vollständigen Kartendaten.'], ['Belegprüfung', 'Wenn serverseitige Prüfung aktiv ist, können Beleg- und begrenzte technische Daten nur zur Kaufprüfung, Betrugsvermeidung und Unterstützung verarbeitet werden.'], ['Analytics und Werbung', 'Die veröffentlichte App enthält keine Werbe-SDKs, kein Cross-App-Tracking und keine Verhaltensanalyse.'], ['Anbieter', 'Apple und Google verarbeiten Käufe nach ihren eigenen Richtlinien. Iaptic und Google Cloud können bei der Prüfung helfen.'], ['Aufbewahrung', 'Lokale Einstellungen bleiben bis zum Löschen der App-Daten oder zur Deinstallation auf dem Gerät.'], ['Kinder', 'Die App richtet sich an ein allgemeines Publikum und nicht gezielt an Kinder unter 13 Jahren.'], ['Deine Wahl', 'Du kannst lokale Einstellungen durch Löschen der App-Daten oder Deinstallation zurücksetzen.'], ['Kontakt', 'E-Mail: <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    terms: { updated: 'Gültig ab 10. Juni 2026', h1: 'Nutzungsbedingungen', intro: 'Mit der Nutzung von Digital Fidget: Mental ASMR akzeptierst du diese Bedingungen.', sections: [['Der Dienst', 'Die App bietet Sounds, visuelle Themes und haptisches Feedback zur allgemeinen Entspannung und Unterhaltung. Sie ist kein Medizinprodukt.'], ['Premium-Kauf', 'Premium ist ein lebenslanger Kauf für das Apple- oder Google-Konto, mit dem er gekauft wurde.'], ['Zahlungen und Erstattungen', 'Apple oder Google verarbeitet Zahlungen. Erstattungen folgen den Regeln des jeweiligen Stores.'], ['Zulässige Nutzung', 'Nutze die App persönlich und rechtmäßig. Umgehe keine Kaufprüfung und verbreite keine kostenpflichtigen Inhalte.'], ['Verfügbarkeit', 'Wir können Teile der App verbessern, aktualisieren oder ändern.'], ['Haftung', 'Die App wird im gesetzlich zulässigen Umfang “wie besehen” bereitgestellt.'], ['Kontakt', 'Fragen an <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    support: { updated: 'Digital Fidget: Mental ASMR Support', h1: 'Wie können wir helfen?', intro: '', sections: [['Premium wiederherstellen', 'Öffne die App, Customize, Premium und tippe Restore Purchase. Verwende dasselbe Apple- oder Google-Konto.'], ['Sound oder Vibration fehlt', 'Prüfe Sound und Vibration in Settings sowie Lautstärke, Stummmodus und System-Haptik.'], ['Kauf ausstehend', 'Manche Transaktionen brauchen Freigabe. Warte auf die Store-Bestätigung und nutze Restore Purchase.'], ['Support kontaktieren', 'Nenne Gerätemodell, OS-Version, App-Version und eine kurze Beschreibung. Sende keine Karten- oder Passwortdaten.']], email: 'Support kontaktieren' }
  }
};

SITE_TEXT.es = {
  ...SITE_TEXT.fr,
  name: 'Español',
  nav: ['Privacidad', 'Términos', 'Soporte'],
  landing: { title: 'Digital Fidget: Mental ASMR - Pulsa. Escucha. Respira.', eyebrow: 'Un pequeño ritual táctil', h1: 'Pulsa.<br>Escucha.<br>Respira.', lead: 'Un botón de bienestar tranquilo para momentos de saturación. Siente una respuesta háptica suave, escucha un clic satisfactorio y toma una pausa breve.', store: 'Próximamente en', features: [['Diseñado para el tacto', 'El sonido ASMR vivo y la háptica nativa hacen que cada pulsación se sienta clara y firme.'], ['Lo esencial es gratis', 'Classic Click y los temas Classic y Night siempre están disponibles. Premium desbloquea más temas, sonidos y skins.'], ['Privado y enfocado', 'Sin anuncios, sin cuenta obligatoria y sin analítica de comportamiento.']] },
  pages: {
    privacy: { updated: 'Vigente desde el 10 de junio de 2026', h1: 'Política de privacidad', intro: 'Digital Fidget: Mental ASMR funciona sin cuenta, publicidad ni analítica de comportamiento. Esta política explica la información limitada relacionada con el uso y las compras.', sections: [['Datos en tu dispositivo', 'Tema, sonido, posición del botón, onboarding y preferencias de sonido o vibración se guardan localmente. No recibimos esos datos.'], ['Compras', 'Premium es una compra de por vida procesada por App Store o Google Play. No recibimos los datos completos de tu tarjeta.'], ['Validación de recibos', 'Si se activa, el recibo y metadatos técnicos limitados se usan solo para verificar compras, prevenir fraude y dar soporte.'], ['Analítica y publicidad', 'La app publicada no incluye SDKs de anuncios, seguimiento entre apps ni analítica de comportamiento.'], ['Proveedores', 'Apple y Google procesan compras según sus políticas. Iaptic y Google Cloud pueden ayudar a validarlas.'], ['Retención', 'Las preferencias locales permanecen hasta que borres los datos de la app o la desinstales.'], ['Niños', 'La app es para público general y no está dirigida a menores de 13 años.'], ['Tus opciones', 'Puedes restablecer preferencias borrando los datos de la app o desinstalándola.'], ['Contacto', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    terms: { updated: 'Vigente desde el 10 de junio de 2026', h1: 'Términos de uso', intro: 'Al usar Digital Fidget: Mental ASMR, aceptas estos términos.', sections: [['El servicio', 'La app ofrece sonidos, temas visuales y respuesta háptica para relajación general y entretenimiento. No es un dispositivo médico.'], ['Compra Premium', 'Premium es una compra de por vida para la cuenta de Apple o Google utilizada.'], ['Pagos y reembolsos', 'Apple o Google procesa los pagos. Los reembolsos siguen las reglas de la tienda correspondiente.'], ['Uso aceptable', 'Usa la app de forma personal y legal. No evadas verificaciones ni redistribuyas contenidos de pago.'], ['Disponibilidad', 'Podemos mejorar, actualizar o cambiar partes de la app.'], ['Responsabilidad', 'La app se ofrece “tal cual” en la medida permitida por la ley.'], ['Contacto', 'Preguntas: <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    support: { updated: 'Soporte de Digital Fidget: Mental ASMR', h1: '¿Cómo podemos ayudar?', intro: '', sections: [['Restaurar Premium', 'Abre la app, Customize, Premium y toca Restore Purchase con la misma cuenta Apple o Google.'], ['No hay sonido o vibración', 'Comprueba Sound y Vibration en Settings, además del volumen, modo silencio y ajustes hápticos del sistema.'], ['Compra pendiente', 'Algunas transacciones requieren aprobación. Espera la confirmación de la tienda y usa Restore Purchase.'], ['Contactar soporte', 'Incluye modelo, versión del sistema, versión de la app y una descripción breve. No envíes datos de tarjetas ni contraseñas.']], email: 'Enviar email a soporte' }
  }
};

SITE_TEXT.pt = {
  ...SITE_TEXT.fr,
  name: 'Português',
  nav: ['Privacidade', 'Termos', 'Suporte'],
  landing: { title: 'Digital Fidget: Mental ASMR - Pressione. Ouça. Respire.', eyebrow: 'Um pequeno ritual tátil', h1: 'Pressione.<br>Ouça.<br>Respire.', lead: 'Um botão de bem-estar discreto para momentos sobrecarregados. Sinta um háptico suave, ouça um clique satisfatório e faça uma pausa curta.', store: 'Em breve na', features: [['Tátil por design', 'Som ASMR vivo e háptica nativa tornam cada toque claro e firme.'], ['O essencial é grátis', 'Classic Click e os temas Classic e Night estão sempre disponíveis. Premium libera mais temas, sons e skins.'], ['Privado e focado', 'Sem anúncios, sem conta obrigatória e sem análise comportamental.']] },
  pages: {
    privacy: { updated: 'Em vigor em 10 de junho de 2026', h1: 'Política de privacidade', intro: 'Digital Fidget: Mental ASMR funciona sem conta, anúncios ou análise comportamental. Esta política explica as poucas informações envolvidas no uso e em compras.', sections: [['Dados no dispositivo', 'Tema, som, posição do botão, onboarding e preferências de som ou vibração ficam salvos localmente. Nós não recebemos esses dados.'], ['Compras', 'Premium é uma compra vitalícia processada pela App Store ou Google Play. Não recebemos os dados completos do cartão.'], ['Validação de recibos', 'Se ativada, recibo e metadados técnicos limitados podem ser usados apenas para verificar compras, evitar fraude e oferecer suporte.'], ['Analytics e publicidade', 'A versão publicada não inclui SDKs de anúncios, rastreamento entre apps ou análise comportamental.'], ['Provedores', 'Apple e Google processam compras conforme suas políticas. Iaptic e Google Cloud podem ajudar na validação.'], ['Retenção', 'Preferências locais ficam no dispositivo até limpar os dados ou desinstalar o app.'], ['Crianças', 'O app é para público geral e não é direcionado a menores de 13 anos.'], ['Suas escolhas', 'Você pode redefinir preferências limpando os dados do app ou desinstalando.'], ['Contato', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    terms: { updated: 'Em vigor em 10 de junho de 2026', h1: 'Termos de uso', intro: 'Ao usar Digital Fidget: Mental ASMR, você aceita estes termos.', sections: [['O serviço', 'O app oferece sons, temas visuais e resposta háptica para relaxamento geral e entretenimento. Não é um dispositivo médico.'], ['Compra Premium', 'Premium é uma compra vitalícia para a conta Apple ou Google usada na compra.'], ['Pagamentos e reembolsos', 'Apple ou Google processa pagamentos. Reembolsos seguem as regras da loja correspondente.'], ['Uso aceitável', 'Use o app de forma pessoal e legal. Não burle verificações nem redistribua conteúdos pagos.'], ['Disponibilidade', 'Podemos melhorar, atualizar ou alterar partes do app.'], ['Responsabilidade', 'O app é fornecido “como está”, dentro do permitido por lei.'], ['Contato', 'Perguntas: <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    support: { updated: 'Suporte Digital Fidget: Mental ASMR', h1: 'Como podemos ajudar?', intro: '', sections: [['Restaurar Premium', 'Abra o app, Customize, Premium e toque em Restore Purchase com a mesma conta Apple ou Google.'], ['Som ou vibração indisponível', 'Confira Sound e Vibration em Settings, volume, modo silencioso e ajustes hápticos do sistema.'], ['Compra pendente', 'Algumas transações exigem aprovação. Aguarde a confirmação da loja e use Restore Purchase.'], ['Contato com suporte', 'Inclua modelo do dispositivo, versão do sistema, versão do app e uma breve descrição. Não envie cartão ou senhas.']], email: 'Enviar email ao suporte' }
  }
};

SITE_TEXT.ja = {
  ...SITE_TEXT.fr,
  name: '日本語',
  nav: ['プライバシー', '利用規約', 'サポート'],
  landing: { title: 'Digital Fidget: Mental ASMR - 押す。聴く。整える。', eyebrow: '小さな触覚の儀式', h1: '押す。<br>聴く。<br>整える。', lead: '刺激が多すぎる瞬間のための静かなウェルネスボタン。やさしい触覚、心地よいクリック音、短い集中の休憩を。', store: '近日公開', features: [['触覚を中心に設計', '生きたASMRサウンドとネイティブ触覚が、ひと押しごとに明確で落ち着いた感覚を生みます。'], ['基本機能は無料', 'Classic Click、Classic、Night はいつでも利用できます。Premium で追加テーマ、音、スキンを解放できます。'], ['プライベートで集中', '広告なし、アカウント不要、行動分析なし。']] },
  pages: {
    privacy: { updated: '2026年6月10日施行', h1: 'プライバシーポリシー', intro: 'Digital Fidget: Mental ASMR はアカウント、広告、行動分析なしで動作します。このポリシーは、アプリ利用と購入に関わる限られた情報を説明します。', sections: [['端末に保存される情報', 'テーマ、サウンド、ボタン位置、オンボーディング、音や振動の設定は端末内に保存されます。私たちは受け取りません。'], ['購入', 'Premium は App Store または Google Play で処理される買い切りのアプリ内購入です。カード情報の完全な内容は受け取りません。'], ['レシート検証', '有効な場合、レシートと限定的な技術情報は購入確認、不正防止、サポートのためだけに使われます。'], ['分析、広告、追跡', '公開版アプリには広告SDK、アプリ間追跡、行動分析は含まれません。'], ['サービス提供者', 'Apple と Google は各自のポリシーで購入を処理します。Iaptic と Google Cloud が検証を補助する場合があります。'], ['保持', 'ローカル設定は、アプリデータ削除またはアンインストールまで端末に残ります。'], ['子ども', 'このアプリは一般向けで、13歳未満の子どもを対象にしていません。'], ['選択肢', 'アプリデータ削除またはアンインストールでローカル設定をリセットできます。'], ['連絡先', 'Email <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a>.']] },
    terms: { updated: '2026年6月10日施行', h1: '利用規約', intro: 'Digital Fidget: Mental ASMR を使用すると、この規約に同意したものとみなされます。', sections: [['サービス', 'このアプリは一般的なリラックスと娯楽のためのサウンド、テーマ、触覚フィードバックを提供します。医療機器ではありません。'], ['Premium 購入', 'Premium は購入に使った Apple または Google アカウントに紐づく買い切り購入です。'], ['支払いと返金', '支払いは Apple または Google が処理します。返金は各ストアの規約に従います。'], ['許容される利用', '個人的かつ合法的に利用してください。購入検証の妨害や有料素材の再配布は禁止です。'], ['提供状況', 'アプリの一部を改善、更新、変更することがあります。'], ['免責', '法律で認められる範囲で、アプリは「現状有姿」で提供されます。'], ['連絡先', '質問は <a href="mailto:melnyklabs@gmail.com">melnyklabs@gmail.com</a> へ。']] },
    support: { updated: 'Digital Fidget: Mental ASMR サポート', h1: 'どのようにお手伝いできますか？', intro: '', sections: [['Premium を復元', 'アプリで Customize、Premium を開き、同じ Apple または Google アカウントで Restore Purchase を押してください。'], ['音や振動が使えない', 'Settings の Sound と Vibration、端末の音量、サイレントモード、触覚設定を確認してください。'], ['購入が保留中', '一部の購入は承認が必要です。ストアの確認後、アプリを開き直して Restore Purchase を使ってください。'], ['サポートへ連絡', '端末モデル、OSバージョン、アプリバージョン、問題の短い説明を含めてください。カード情報やパスワードは送らないでください。']], email: 'サポートにメール' }
  }
};

function siteLang() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  const saved = localStorage.getItem('rb_language');
  return SITE_LANGS.includes(fromUrl) ? fromUrl : SITE_LANGS.includes(saved) ? saved : 'en';
}

function renderLegal(page, text) {
  const card = document.querySelector('.legal-card');
  if (!card || !text.pages?.[page]) return;
  const data = text.pages[page];
  card.innerHTML = `
    <p class="updated">${data.updated}</p>
    <h1>${data.h1}</h1>
    ${data.intro ? `<p>${data.intro}</p>` : ''}
    ${data.sections.map(([title, body]) => `<h2>${title}</h2><p>${body}</p>`).join('')}
    ${data.email ? `<a class="support-email" href="mailto:melnyklabs@gmail.com?subject=Digital%20Fidget%20Mental%20ASMR%20Support">${data.email}</a>` : ''}
  `;
}

function applySiteI18n() {
  const lang = siteLang();
  const text = SITE_TEXT[lang] || SITE_TEXT.en;
  localStorage.setItem('rb_language', lang);
  document.documentElement.lang = lang;
  const page = document.body.dataset.page || 'landing';

  document.querySelectorAll('[data-site-link]').forEach((link, index) => {
    const navIndex = index % SITE_TEXT.en.nav.length;
    link.textContent = text.nav[navIndex] || SITE_TEXT.en.nav[navIndex];
    const href = link.getAttribute('href')?.split('?')[0] || '#';
    link.setAttribute('href', `${href}?lang=${lang}`);
  });

  const selector = document.getElementById('site-language');
  if (selector && selector.dataset.ready !== 'true') {
    SITE_LANGS.forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = SITE_TEXT[code].name;
      selector.appendChild(option);
    });
    selector.dataset.ready = 'true';
    selector.addEventListener('change', () => {
      localStorage.setItem('rb_language', selector.value);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', selector.value);
      window.location.href = url.toString();
    });
  }
  if (selector) selector.value = lang;

  if (page === 'landing') {
    document.title = text.landing.title;
    document.querySelector('.eyebrow').textContent = text.landing.eyebrow;
    document.querySelector('.hero h1').innerHTML = text.landing.h1;
    document.querySelector('.lead').textContent = text.landing.lead;
    document.querySelectorAll('.store-button small').forEach(item => item.textContent = text.landing.store);
    document.querySelectorAll('.feature').forEach((item, index) => {
      const feature = text.landing.features[index] || SITE_TEXT.en.landing.features[index];
      item.querySelector('strong').textContent = feature[0];
      item.querySelector('p').textContent = feature[1];
    });
    const analysis = text.landing.analysis || SITE_TEXT.en.landing.analysis;
    document.querySelector('.analysis-kicker').textContent = analysis.kicker;
    document.querySelector('.analysis-card h2').textContent = analysis.title;
    document.querySelector('.analysis-lead').textContent = analysis.lead;
    document.querySelectorAll('.analysis-block').forEach((item, index) => {
      const block = analysis.items[index] || SITE_TEXT.en.landing.analysis.items[index];
      item.querySelector('strong').textContent = block[0];
      item.querySelector('p').textContent = block[1];
    });
    return;
  }

  renderLegal(page, text);
}

document.addEventListener('DOMContentLoaded', applySiteI18n);
