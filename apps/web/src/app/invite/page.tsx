import Link from "next/link";
import styles from "@/components/auth/auth-shell.module.css";

export default function InviteHelpPage() {
  return (
    <main className={styles.statusPage}>
      <section className={styles.statusCard}>
        <span className={styles.statusIcon}>H</span>
        <h1>打开完整的邀请链接</h1>
        <p>出于安全考虑，邀请令牌不会单独在页面中输入。请从团队发给你的完整链接进入。</p>
        <Link href="/app" className={styles.textLink}>
          返回工作区
        </Link>
      </section>
    </main>
  );
}
