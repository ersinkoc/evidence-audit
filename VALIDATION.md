# Paket doğrulaması — 2026-10-04

Windows üzerinde Node.js v24.13.0, npm 11.11.0 ve Skills CLI 1.7.0 ile doğrulandı.

| Kontrol | Sonuç |
| --- | --- |
| `npm run check` | Paket yapısı geçti; 5 helper testi geçti, 0 başarısız, 0 atlanan |
| Codex `skill-creator/scripts/quick_validate.py skills/evidence-audit` | `Skill is valid!` |
| `npx skills@1.7.0 add . --list` | Tek skill keşfedildi: `evidence-audit` |
| İzole projede `npx skills@1.7.0 add D:/Codebox/Skill-Evidence-Audit --skill evidence-audit --agent claude-code codex --copy --yes` | Kurulum çıkış kodu 0 |
| Kurulan Claude Code ve Codex dosyaları | Kaynaktaki dört dosyanın tamamı ile byte düzeyinde eşit |
| Kurulu helper ile yeni ve devam eden ledger | İlk çağrı `created: true`, ikinci çağrı `created: false`; ikisinde de `F1` önerisi |
| `dist/evidence-audit.zip` içeriği | Tam olarak dört skill dosyası; kaynakla byte düzeyinde eşit |

Helper testleri mevcut kaynak/ledger korunmasını, farklı kapsamlar arasında ID devamını, eşzamanlı exclusive oluşturmayı, geçersiz yolları ve dışarı yönlenen linkleri kontrol eder. Paket herhangi bir npm bağımlılığı kurdurmaz.

İlk doğrulamada yerel Codex validator'ı Agent Skills standardındaki `compatibility` frontmatter alanını reddetti. Gereksinimler ana metne taşındı; son doğrulama geçti.

İlk deneme kurulumu yalnızca `.temp_files/install-check/` altında yapıldı. Kullanıcının global skill dizinlerine kurulmadı. Gerçek Claude/Codex model oturumlarında audit davranış değerlendirmesi ve diğer işletim sistemlerinde çalıştırma yapılmadı. Paket kurulumu, model kararlarının doğruluğunu veya bir hedef kod tabanının hatasızlığını kanıtlamaz.

İlk paket hazırlığı sırasında bu klasör Git deposu olmadığı için `git diff --check` çalıştırılmadı. Bu bölüm ilk yerel doğrulama kaydıdır; yayın kontrolleri ayrıca aşağıda kaydedilir.

## GitHub yayın doğrulaması — 2026-10-04

- Depo: [ersinkoc/evidence-audit](https://github.com/ersinkoc/evidence-audit); GitHub API üzerinden görünürlük `PUBLIC`, varsayılan dal `main` doğrulandı.
- Yayın öncesi `npm run check`: yapı doğrulaması ve 5 test geçti.
- `git diff --cached --check` ve `git diff --check`: çıkış kodu 0.
- `.temp_files/github-install-check/` içinde `npx skills@1.7.0 add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --copy --yes`: GitHub deposunu klonladı, tek skill keşfetti ve iki ajan için kurulum tamamlandı; çıkış kodu 0.
- GitHub'dan kurulan iki kopyada dört skill dosyasının tamamı kaynakla byte düzeyinde eşit.
- README kurulum komutları gerçek depo adına güncellendi. Global kullanıcı kurulumu yapılmadı.
