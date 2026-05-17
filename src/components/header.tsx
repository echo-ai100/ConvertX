import { t } from "../locales";

export const Header = ({
  loggedIn,
  accountRegistration,
  allowUnauthenticated,
  hideHistory,
  webroot = "",
  locale = "en",
  userRole = "user",
}: {
  loggedIn?: boolean;
  accountRegistration?: boolean;
  allowUnauthenticated?: boolean;
  hideHistory?: boolean;
  webroot?: string;
  locale?: string;
  userRole?: string;
}) => {
  let rightNav: JSX.Element;
  if (loggedIn) {
    rightNav = (
      <ul class="flex gap-4">
        {!hideHistory && (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/history`}
            >
              {t("nav.history", locale)}
            </a>
          </li>
        )}
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/credits`}
          >
            {t("nav.credits", locale)}
          </a>
        </li>
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/recharge`}
          >
            {t("nav.recharge", locale)}
          </a>
        </li>
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/check-in`}
          >
            {t("nav.checkIn", locale)}
          </a>
        </li>
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/referral`}
          >
            {t("nav.referral", locale)}
          </a>
        </li>
        {userRole === "admin" && (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/admin`}
            >
              {t("nav.admin", locale)}
            </a>
          </li>
        )}
        {!allowUnauthenticated ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/account`}
            >
              {t("nav.account", locale)}
            </a>
          </li>
        ) : null}
        {!allowUnauthenticated ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/logoff`}
            >
              {t("nav.logout", locale)}
            </a>
          </li>
        ) : null}
        <li class="flex gap-1">
          <a
            class={`
              ${locale === "en" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/en`}
          >
            EN
          </a>
          <span class="text-neutral-600">|</span>
          <a
            class={`
              ${locale === "zh-CN" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/zh-CN`}
          >
            中文
          </a>
        </li>
      </ul>
    );
  } else {
    rightNav = (
      <ul class="flex gap-4">
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/login`}
          >
            {t("nav.login", locale)}
          </a>
        </li>
        {accountRegistration ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/register`}
            >
              {t("nav.register", locale)}
            </a>
          </li>
        ) : null}
        <li class="flex gap-1">
          <a
            class={`
              ${locale === "en" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/en`}
          >
            EN
          </a>
          <span class="text-neutral-600">|</span>
          <a
            class={`
              ${locale === "zh-CN" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/zh-CN`}
          >
            中文
          </a>
        </li>
      </ul>
    );
  }

  return (
    <header class="w-full p-4">
      <nav class={`mx-auto flex max-w-4xl justify-between rounded-sm bg-neutral-900 p-4`}>
        <ul>
          <li>
            <strong>
              <a href={`${webroot}/`}>ConvertX</a>
            </strong>
          </li>
        </ul>
        {rightNav}
      </nav>
    </header>
  );
};