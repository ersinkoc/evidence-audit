# Evidence Audit

Her dilde ve somut kod kapsamlarında kanıta dayalı hata arama ve düzeltme skill'i. Bir bulgu için önce mevcut kodda çalışan hata kanıtı, ardından dar düzeltme, üç ardışık deterministik doğrulama ve gerektiğinde kalıcı regresyon testi ister.

Paket [Agent Skills standardını](https://agentskills.io/specification) kullanır. Claude Code, Codex ve `skills` CLI'ın desteklediği diğer ajanlar aynı `skills/evidence-audit/` klasörünü kurabilir. Her uygulamanın skill keşfi ve komut çalıştırma yetenekleri farklıdır; yalnızca sohbet erişimi olan bir ortam gerçek audit yapamaz.

## Kurulum

Kurulum aracı [skills.sh / Vercel Skills CLI](https://github.com/vercel-labs/skills): `npx skills add`.

Depodaki skill'i listele:

```sh
npx skills add ersinkoc/evidence-audit --list
```

Kendi kod projenin kökünde çalıştır:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --copy
```

Tüm projelerde kullanmak için global kurulum:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent claude-code codex --global --copy
```

Diğer desteklenen ajanları da seçmek için:

```sh
npx skills add ersinkoc/evidence-audit --skill evidence-audit --agent '*'
```

Global kurulumu tüm ajanlara yapmak istersen aynı komuta `--global` ekle. Kurulumun sunduğu hedefleri incele; aynı isimli mevcut bir skill varsa kurulum onu güncelleyebilir. Windows'ta PowerShell `npx.ps1` çalıştırmayı engelliyorsa `npx.cmd` kullan. `--copy` sembolik bağlantı ihtiyacını kaldırır.

Yerel geliştirme kopyasından kurmak için kaynak olarak klasör yolunu ver:

```sh
npx skills add ./evidence-audit --skill evidence-audit --agent claude-code codex --copy
```

Bu dağıtım için npm'e ayrı bir paket yayınlamak gerekmez; `npx` installer'ı çalıştırır, skill dosyalarını yerel klasörden veya Git deposundan alır.

## Kullanım

Codex:

```text
$evidence-audit src/auth
```

Claude Code:

```text
/evidence-audit src/auth
```

Diğer ajanlar için uygulamanın skill çağırma biçimini kullan veya doğal dilde yaz:

```text
Use evidence-audit to find and prove real bugs in src/auth. Preserve existing edits.
```

Kapsam belirsizse skill önce aday kapsamları listeler. Her tur `.temp_files/ledger_<scope-slug>.md`, `prove_F<ID>_*` ve `verify_F<ID>_*` kanıtlarını bırakır. Gerçek hata bulunmayan tur da geçerlidir. Statik şüphe, derleme hatası veya bozuk kontrol vakası doğrulanmış bulgu sayılmaz.

## Paket içeriği

```text
skills/evidence-audit/
  SKILL.md                       Ortak audit yönergeleri
  agents/openai.yaml             Codex arayüzü ve implicit invocation ayarı
  assets/ledger-template.md      Ledger ve rapor şablonu
  scripts/init-ledger.mjs        İsteğe bağlı, bağımlılıksız ledger başlatıcı
```

`agents/openai.yaml` Codex'e özgüdür. Ortak audit yönergeleri Claude'a özgü araç adları, değişkenler veya otomatik shell çalıştıran enjeksiyonlar içermez. Otomatik kullanım Codex'te açık; Claude Code varsayılan skill keşfini kullanır. Uygulama ve kullanıcı izinleri her zaman geçerlidir.

Ledger yardımcısı için mevcut Node.js 18+ yeterlidir. Hedef projeye Node veya test framework'ü kurmak gerekmez; helper isteğe bağlıdır. Kurulu skill klasöründeki script'e tam yol ver:

```sh
node "<installed-skill-dir>/scripts/init-ledger.mjs" --repo "<repo-root>" --slug src-auth --scope src/auth --scope tests/auth
```

Helper mevcut ledger'ı değiştirmez, kaynak veya Git durumuna dokunmaz. Kapsam yollarını kontrol eder, şablon oluşturur ve tüm ledger/kanıt isimlerinden sonraki boş ID'yi önerir. ID rezerve edilmez; eşzamanlı audit yapanlar yeni kanıt yazmadan önce koordinasyon kurmalıdır. Toolchain, Git baseline ve komut çıktıları agent tarafından gerçek çalıştırmalardan doldurulur.

Elle kurulumda `skills/evidence-audit/` klasörünün tamamını uygulamanın skill dizinine kopyala; sadece `SKILL.md` kopyalama. Arşiv alabilen uygulamalarda bu klasörü ZIP olarak paketleyip kendi içe aktarma yolunu kullan. Manuel fallback'te agent'a `SKILL.md` dosyasını okutmak mümkündür; otomatik keşif veya test çalıştırma yeteneği kazandırmaz.

## Geliştirici kontrolleri

Harici npm bağımlılığı yoktur; `npm install` gerekmez.

```sh
npm run check
npx skills add . --list
```

`npm run check`, paket yapısını doğrular ve helper'ın gerçek dosya davranışlarını test eder: mevcut ledger'ın korunması, ID devamı, aynı dosya için eşzamanlı oluşturma ve kapsam/link sınırları. Kontroller bir modelin her audit kararını doğru vereceğini veya hedef projenin hatasız olduğunu kanıtlamaz.

## Kaynaklar

- [Agent Skills specification](https://agentskills.io/specification)
- [Skills CLI kaynak ve kurulum seçenekleri](https://github.com/vercel-labs/skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [OpenAI skill oluşturma belgeleri](https://learn.chatgpt.com/docs/build-skills)
