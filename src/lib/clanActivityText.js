export function localizeClanActivityText(entry, t) {
  const text = String(entry?.text || "");
  const match = (pattern) => text.match(pattern);
  let found = match(/^(✉\s+)(.+?) надіслав оголошення: «(.+)»\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_sent_announcement", { title: found[3] })}`;
  found = match(/^(✓\s+)(.+?) приєднався до клану\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_joined")}`;
  found = match(/^(↩\s+)(.+?) покинув клан\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_left")}`;
  found = match(/^(⚠\s+)(.+?) вигнав (.+?) з клану\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_kicked", { name: found[3] })}`;
  found = match(/^(✎\s+)(.+?) змінив опис клану\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_changed_description")}`;
  found = match(/^(✎\s+)(.+?) прибрав закріплене оголошення\.$/);
  if (found) return `${found[1]}${found[2]} ${t("clan_panel.log_removed_announcement")}`;
  found = match(/^(↑|↓) (.+?) (підвищив|понизив) (.+?): (.+?) → (.+?)\.$/);
  if (found) {
    const roles = { 'Космобатя': 'leader', 'Супутник': 'deputy', 'Космодід': 'elder', 'Стажер': 'member' };
    const role = value => roles[value] ? t('clan_panel.role_' + roles[value]) : value;
    return found[1] + ' ' + found[2] + ' ' + t(found[3] === 'підвищив' ? 'clan_panel.log_promoted' : 'clan_panel.log_demoted', { name: found[4], from: role(found[5]), to: role(found[6]) });
  }
  found = match(/^(✓|×) (.+?) (прийняв|відхилив заявку) (.+?)(?: до клану)?\.$/);
  if (found) return found[1] + ' ' + found[2] + ' ' + t(found[3] === 'прийняв' ? 'clan_panel.log_accepted' : 'clan_panel.log_rejected', { name: found[4] });
  found = match(/^(★) (.+?) передав звання Космобаті (.+?)\.$/);
  if (found) return found[1] + ' ' + found[2] + ' ' + t('clan_panel.log_transferred', { name: found[3] });
  found = match(/^(⚙) (.+?) змінив (тип вступу|мінімальний рівень): (.+?) → (.+?)\.$/);
  if (found) return found[1] + ' ' + found[2] + ' ' + t(found[3] === 'тип вступу' ? 'clan_panel.log_join_type' : 'clan_panel.log_min_level', { from: found[4], to: found[5] });
  return text;
}

