import{_ as a,o as i,c as n,ag as t}from"./chunks/framework.BYehg5q7.js";const c=JSON.parse('{"title":"pkp stats","description":"","frontmatter":{},"headers":[],"relativePath":"cli/stats.md","filePath":"cli/stats.md"}'),p={name:"cli/stats.md"};function l(e,s,h,k,r,d){return i(),n("div",null,[...s[0]||(s[0]=[t(`<h1 id="pkp-stats" tabindex="-1">pkp stats <a class="header-anchor" href="#pkp-stats" aria-label="Permalink to &quot;pkp stats&quot;">​</a></h1><p>Show statistics for a PKP catalog.</p><h2 id="usage" tabindex="-1">Usage <a class="header-anchor" href="#usage" aria-label="Permalink to &quot;Usage&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pkp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stats</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> [directory] [options]</span></span></code></pre></div><h2 id="arguments" tabindex="-1">Arguments <a class="header-anchor" href="#arguments" aria-label="Permalink to &quot;Arguments&quot;">​</a></h2><table tabindex="0"><thead><tr><th>Argument</th><th>Description</th><th>Default</th></tr></thead><tbody><tr><td><code>directory</code></td><td>Catalog directory to analyze</td><td><code>.</code></td></tr></tbody></table><h2 id="options" tabindex="-1">Options <a class="header-anchor" href="#options" aria-label="Permalink to &quot;Options&quot;">​</a></h2><table tabindex="0"><thead><tr><th>Option</th><th>Description</th><th>Default</th></tr></thead><tbody><tr><td><code>-v, --verbose</code></td><td>Show detailed stats per file</td><td><code>false</code></td></tr><tr><td><code>-j, --json</code></td><td>Output as JSON</td><td><code>false</code></td></tr></tbody></table><h2 id="examples" tabindex="-1">Examples <a class="header-anchor" href="#examples" aria-label="Permalink to &quot;Examples&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># Analyze current directory</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pkp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stats</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># Analyze specific catalog</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pkp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stats</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./my-catalog</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># Verbose output (shows each file)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pkp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stats</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./products</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --verbose</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># JSON output (for scripting)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pkp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stats</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./products</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --json</span></span></code></pre></div><h2 id="output" tabindex="-1">Output <a class="header-anchor" href="#output" aria-label="Permalink to &quot;Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>📈 Analyzing PKP catalog...</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Found 11 markdown file(s)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>📊 Catalog Statistics</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Overview:</span></span>
<span class="line"><span>  Total products:    11</span></span>
<span class="line"><span>  Valid:             11</span></span>
<span class="line"><span>  With price:        11 (100%)</span></span>
<span class="line"><span>  With images:       0 (0%)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Categories:</span></span>
<span class="line"><span>  celulares/smartphones     █████░░░░░░░░░░░░░░░ 3 (27%)</span></span>
<span class="line"><span>  moda                      ████░░░░░░░░░░░░░░░░ 2 (18%)</span></span>
<span class="line"><span>  notebooks                 ████░░░░░░░░░░░░░░░░ 2 (18%)</span></span>
<span class="line"><span>  eletrodomesticos          ██░░░░░░░░░░░░░░░░░░ 1 (9%)</span></span>
<span class="line"><span>  games                     ██░░░░░░░░░░░░░░░░░░ 1 (9%)</span></span>
<span class="line"><span>  tvs                       ██░░░░░░░░░░░░░░░░░░ 1 (9%)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Completeness:</span></span>
<span class="line"><span>  Average:           85%</span></span>
<span class="line"><span>  Min:               62%</span></span>
<span class="line"><span>  Max:               100%</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Distribution:</span></span>
<span class="line"><span>    0-25%      ░░░░░░░░░░░░░░░░░░░░ 0 (0%)</span></span>
<span class="line"><span>    26-50%     ░░░░░░░░░░░░░░░░░░░░ 0 (0%)</span></span>
<span class="line"><span>    51-75%     ████░░░░░░░░░░░░░░░░ 2 (18%)</span></span>
<span class="line"><span>    76-100%    ████████████████░░░░ 9 (82%)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Confidence Sources:</span></span>
<span class="line"><span>  manufacturer           6 (55%)</span></span>
<span class="line"><span>  ai-generated           3 (27%)</span></span>
<span class="line"><span>  scraped                2 (18%)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✨ Analysis complete!</span></span></code></pre></div><h2 id="json-output" tabindex="-1">JSON Output <a class="header-anchor" href="#json-output" aria-label="Permalink to &quot;JSON Output&quot;">​</a></h2><p>With <code>--json</code>, outputs structured data:</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;totalProducts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">11</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;validProducts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">11</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;invalidProducts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;categories&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;celulares/smartphones&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;moda&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;notebooks&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;completeness&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;average&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">85</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;min&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">62</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;max&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">100</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;distribution&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;0-25%&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;26-50%&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;51-75%&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;76-100%&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">9</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;confidence&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;manufacturer&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">6</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;ai-generated&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;scraped&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;withPrice&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">11</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;withImages&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><h2 id="use-cases" tabindex="-1">Use Cases <a class="header-anchor" href="#use-cases" aria-label="Permalink to &quot;Use Cases&quot;">​</a></h2><ul><li><strong>Catalog auditing</strong>: Check overall health of your product data</li><li><strong>CI/CD pipelines</strong>: Monitor completeness metrics over time</li><li><strong>Data quality</strong>: Identify products needing improvement</li><li><strong>Reporting</strong>: Generate statistics for stakeholders</li></ul>`,17)])])}const E=a(p,[["render",l]]);export{c as __pageData,E as default};
