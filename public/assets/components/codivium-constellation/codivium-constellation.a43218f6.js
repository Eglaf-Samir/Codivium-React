(function () {
    const componentCss = `
      :host{ display:block; }
      .constellation-wrap{
        margin-top: 6px;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: var(--shadow, 0 18px 60px rgba(0,0,0,0.62));
        background: rgba(0,0,0,0.18);
        width: min(1680px, 98vw);
        margin-left: auto;
        margin-right: auto;
      }
      .constellation-scene{
        width: 100%;
        height: clamp(620px, 82vh, 860px);
        border-radius: 0;
        overflow: hidden;
        background:
          radial-gradient(circle at 35% 18%, rgba(255,255,255,0.06), transparent 40%),
          radial-gradient(circle at 70% 55%, rgba(185,140,255,0.10), transparent 45%),
          linear-gradient(180deg, #04040a, #000);
        border: none;
        user-select:none;
        position:relative;
      }
      canvas{ width:100%; height:100%; display:block; cursor:default; }
    `;

    class CodiviumConstellation extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._mounted = false;
        this._cleanup = [];
        this._resizeFn = null;
      }

      connectedCallback() {
        if (this._mounted) return;
        this._mounted = true;

        this.shadowRoot.innerHTML = `
          <style>${componentCss}</style>
          <div class="constellation-wrap">
            <div class="constellation-scene" aria-label="Codivium constellation">
              <canvas></canvas>
            </div>
          </div>
        `;

        this.style.display = "block";
        this.style.width = "100%";
        requestAnimationFrame(() => this._init());
      }

      disconnectedCallback() {
        for (const fn of this._cleanup) {
          try { fn(); } catch (e) {}
        }
        this._cleanup = [];
        if (window.constellationResize && window.constellationResize.__owner === this) {
          delete window.constellationResize;
        }
      }

      resize() {
        if (typeof this._resizeFn === "function") this._resizeFn();
      }

      _init() {
        const scene = this.shadowRoot.querySelector(".constellation-scene");
        const canvas = this.shadowRoot.querySelector("canvas");
        if (!scene || !canvas) return;

        const ctx = canvas.getContext("2d");

        const GROUPS = {
          "Algorithms": [
            "Sliding Window","Two Pointers","Binary Search","Dynamic Programming","Graph Traversal"
          ],
          "Data Structures": [
            "Arrays","Strings","Hash Maps","Trees","Heaps"
          ],
          "Interview Practice": [
            "Timed Problems","Clean Solutions","Edge Cases","Complexity Review","Pattern Recognition"
          ],
          "Micro Challenges": [
            "Atomic Skills","Mental Models","Deliberate Practice","Pattern Isolation","Micro Tutorials"
          ],
          "MCQ Diagnosis": [
            "Concept Checks","Knowledge Gaps","Weak Spot Analysis","Topic Coverage","Targeted Review"
          ],
          "Performance Insights": [
            "Immediate Feedback","Attempt Analysis","Progress Tracking","Convergence","Performance Insights"
          ],
          "Coaching": [
            "AI Coaching","Suggested Next Step","Focus Areas","Adaptive Practice","Guided Progress"
          ]
        };

        const OUTER_GROUPS = {
          "Algorithms": [
            "Greedy","Recursion/Backtracking"
          ],
          "Data Structures": [
            "Linked Lists","Stacks/Queues","Graphs","Tries"
          ]
        };

        const HUB_ORDER = [
          "Algorithms",
          "Data Structures",
          "Interview Practice",
          "Micro Challenges",
          "MCQ Diagnosis",
          "Performance Insights",
          "Coaching"
        ];

        const HUB_LAYOUT = {
          "Algorithms": { x: 0.10, y: 0.50 },
          "Data Structures": { x: 0.38, y: 0.22 },
          "Interview Practice": { x: 0.18, y: 0.22 },
          "Micro Challenges": { x: 0.47, y: 0.49 },
          "MCQ Diagnosis": { x: 0.29, y: 0.80 },
          "Performance Insights": { x: 0.75, y: 0.29 },
          "Coaching": { x: 0.79, y: 0.69 }
        };

        const HUB_COLOR = {
          "Algorithms": { core:"#4aa3ff", glow:"rgba(74,163,255,0.26)", label:"rgba(220,239,255,0.98)" },
          "Data Structures": { core:"#2ce9c6", glow:"rgba(44,233,198,0.22)", label:"rgba(220,255,248,0.98)" },
          "Interview Practice": { core:"#ffb24a", glow:"rgba(255,178,74,0.24)", label:"rgba(255,241,218,0.98)" },
          "Micro Challenges": { core:"#ff7d8f", glow:"rgba(255,125,143,0.22)", label:"rgba(255,230,235,0.98)" },
          "MCQ Diagnosis": { core:"#6bdc6b", glow:"rgba(107,220,107,0.22)", label:"rgba(231,255,231,0.98)" },
          "Performance Insights": { core:"#b98cff", glow:"rgba(185,140,255,0.24)", label:"rgba(243,233,255,0.98)" },
          "Coaching": { core:"#f68ad9", glow:"rgba(246,138,217,0.22)", label:"rgba(255,235,250,0.98)" },
          "Mastery": { core:"#f6d58a", glow:"rgba(246,213,138,0.24)", label:"rgba(255,248,231,0.98)" }
        };

        const GROUP_LINKS = [
          ["Algorithms", "Interview Practice"],
          ["Data Structures", "Interview Practice"],
          ["Interview Practice", "Micro Challenges"],
          ["Micro Challenges", "Performance Insights"],
          ["MCQ Diagnosis", "Performance Insights"],
          ["Performance Insights", "Coaching"]
        ];

        const NODE_COLOR = {
          fillA: "rgba(255,255,255,0.14)",
          fillB: "rgba(0,0,0,0.92)",
          line: "rgba(255,255,255,0.14)",
          text: "rgba(185,140,255,0.92)",
          textHighlight: "rgba(246,213,138,1)",
          halo: "rgba(185,140,255,0.14)",
          haloHighlight: "rgba(246,213,138,0.18)"
        };

        const TOPICS = [...Object.values(GROUPS).flat(), ...Object.values(OUTER_GROUPS).flat()];
        const TOPIC_TO_GROUP = new Map();
        Object.entries(GROUPS).forEach(([group, items]) => {
          items.forEach((item) => TOPIC_TO_GROUP.set(item, group));
        });
        Object.entries(OUTER_GROUPS).forEach(([group, items]) => {
          items.forEach((item) => TOPIC_TO_GROUP.set(item, group));
        });

        const edges = [
          // Algorithms ↔ Data Structures
          ["Sliding Window", "Arrays"],
          ["Sliding Window", "Strings"],
          ["Two Pointers", "Arrays"],
          ["Binary Search", "Arrays"],
          ["Graph Traversal", "Trees"],

          // Interview Practice
          ["Timed Problems", "Pattern Recognition"],
          ["Clean Solutions", "Complexity Review"],
          ["Edge Cases", "Pattern Recognition"],

          // Micro Challenges
          ["Atomic Skills", "Mental Models"],
          ["Deliberate Practice", "Pattern Isolation"],
          ["Micro Tutorials", "Atomic Skills"],

          // MCQ Diagnosis
          ["Concept Checks", "Knowledge Gaps"],
          ["Weak Spot Analysis", "Targeted Review"],
          ["Topic Coverage", "Knowledge Gaps"],

          // Performance Insights
          ["Immediate Feedback", "Attempt Analysis"],
          ["Progress Tracking", "Convergence"],
          ["Performance Insights", "Immediate Feedback"],

          // Coaching
          ["AI Coaching", "Suggested Next Step"],
          ["Focus Areas", "Adaptive Practice"],
          ["Guided Progress", "Suggested Next Step"],

          // Curated cross-group links
          ["Pattern Recognition", "Sliding Window"],
          ["Complexity Review", "Dynamic Programming"],
          ["Micro Tutorials", "Immediate Feedback"],
          ["Knowledge Gaps", "Focus Areas"],
          ["Suggested Next Step", "Targeted Review"],
          ["Adaptive Practice", "Deliberate Practice"]
          // Additional outer-layer links
          ["Greedy", "Dynamic Programming"],
          ["Recursion/Backtracking", "Graph Traversal"],
          ["Recursion/Backtracking", "Pattern Recognition"],
          ["Linked Lists", "Arrays"],
          ["Stacks/Queues", "Trees"],
          ["Graphs", "Graph Traversal"],
          ["Tries", "Strings"]
        ];

        function isEdge(a,b){
          for (const [u,v] of edges){
            if ((u===a && v===b) || (u===b && v===a)) return true;
          }
          return false;
        }

        const rand = (a,b)=> a + Math.random()*(b-a);
        const clamp = (n,a,b)=> Math.max(a, Math.min(b,n));
        const dist2 = (ax,ay,bx,by)=> { const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; };
        function getSize(){
          const r = scene.getBoundingClientRect();
          return { w: r.width, h: r.height };
        }

        const HUB_R = 28;
        const MOON_R = 13;
        const SUB_HUB_R = MOON_R * 1.25;
        const NODE_PADDING = 11;
        const MIN_NODE_DIST = (MOON_R * 2) + NODE_PADDING;

        function hubRadius(id){
          return (id === "Algorithms" || id === "Data Structures") ? SUB_HUB_R : HUB_R;
        }

        const hubs = HUB_ORDER.map((id) => ({ id, x:0, y:0 }));
        const nodes = [];
        const nodeMap = new Map();
        let hoveredNode = null;
        let draggingHub = null;
        let draggingNode = null;
        let dragOffset = {x:0,y:0};
        let rafHandle = null;

        function scheduleDraw(){
          if (rafHandle) return;
          rafHandle = requestAnimationFrame(() => {
            rafHandle = null;
            draw();
          });
        }

        function drawHub(h){
          const C = HUB_COLOR[h.id] || HUB_COLOR["Mastery"];
          const radius = hubRadius(h.id);

          ctx.beginPath();
          ctx.arc(h.x, h.y, radius + 22, 0, Math.PI*2);
          ctx.fillStyle = C.glow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(h.x, h.y, radius, 0, Math.PI*2);
          const g = ctx.createRadialGradient(
            h.x - radius*0.40, h.y - radius*0.45, radius*0.10,
            h.x, h.y, radius*1.20
          );
          g.addColorStop(0, "rgba(255,255,255,0.35)");
          g.addColorStop(0.22, C.core);
          g.addColorStop(0.62, "rgba(0,0,0,0.82)");
          g.addColorStop(1, "rgba(0,0,0,0.96)");
          ctx.fillStyle = g;
          ctx.fill();

          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "rgba(255,255,255,0.18)";
          ctx.stroke();

          ctx.font = (h.id === "Algorithms" || h.id === "Data Structures")
            ? `900 9px Segoe UI, system-ui, sans-serif`
            : `900 11px Segoe UI, system-ui, sans-serif`;
          ctx.fillStyle = C.label;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const words = h.id.split(" ");
          if (words.length <= 2) {
            ctx.fillText(h.id, h.x, h.y);
          } else {
            const mid = Math.ceil(words.length/2);
            ctx.fillText(words.slice(0,mid).join(" "), h.x, h.y - 7);
            ctx.fillText(words.slice(mid).join(" "), h.x, h.y + 8);
          }
        }

        function drawMoon(n, alpha, highlight=false, pinned=false){
          ctx.save();
          ctx.globalAlpha = alpha;

          ctx.beginPath();
          const moonR = n.outer ? (MOON_R - 1) : MOON_R;
          ctx.arc(n.x, n.y, moonR + 8, 0, Math.PI*2);
          ctx.fillStyle = highlight ? NODE_COLOR.haloHighlight : NODE_COLOR.halo;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(n.x, n.y, moonR, 0, Math.PI*2);
          const g = ctx.createLinearGradient(n.x-moonR, n.y-moonR, n.x+moonR, n.y+moonR);
          g.addColorStop(0, NODE_COLOR.fillA);
          g.addColorStop(0.36, "rgba(0,0,0,0.60)");
          g.addColorStop(1, NODE_COLOR.fillB);
          ctx.fillStyle = g;
          ctx.fill();

          ctx.lineWidth = highlight ? 1.9 : 1.1;
          ctx.strokeStyle = highlight ? "rgba(255,255,255,0.28)" : NODE_COLOR.line;
          ctx.stroke();

          ctx.font = n.outer ? `900 9.5px Segoe UI, system-ui, sans-serif` : `900 10.5px Segoe UI, system-ui, sans-serif`;
          ctx.fillStyle = highlight ? NODE_COLOR.textHighlight : NODE_COLOR.text;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const words = n.text.split(" ");
          if (words.length <= 2){
            ctx.fillText(n.text, n.x, n.y);
          } else {
            const mid = Math.ceil(words.length/2);
            ctx.fillText(words.slice(0,mid).join(" "), n.x, n.y - 6);
            ctx.fillText(words.slice(mid).join(" "), n.x, n.y + 7);
          }

          if (pinned){
            ctx.beginPath();
            ctx.arc(n.x + MOON_R - 4, n.y - MOON_R + 4, 4, 0, Math.PI*2);
            ctx.fillStyle = "rgba(255,255,255,0.70)";
            ctx.fill();
          }

          ctx.restore();
        }

        function relaxLayout(iterations){
          const { w, h } = getSize();
          const springK = 0.010;
          const centeringK = 0.0018;
          const repelK = 0.55;
          const damping = 0.82;
          const maxV = 2.0;

          for (let it=0; it<iterations; it++){
            for (const n of nodes){
              if (n.pinned) continue;
              const hx = n.hubRef.x, hy = n.hubRef.y;
              const dx = n.x - hx, dy = n.y - hy;
              const d = Math.sqrt(dx*dx + dy*dy) || 0.0001;
              const err = d - n.orbitR;
              const ux = dx / d, uy = dy / d;
              n.vx += (-err * springK) * ux;
              n.vy += (-err * springK) * uy;
              n.vx += (-dx * centeringK);
              n.vy += (-dy * centeringK);
            }

            for (let i=0; i<nodes.length; i++){
              for (let j=i+1; j<nodes.length; j++){
                const a = nodes[i], b = nodes[j];
                if (a.pinned && b.pinned) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx*dx + dy*dy) || 0.0001;
                if (d < MIN_NODE_DIST){
                  const overlap = (MIN_NODE_DIST - d);
                  const ux = dx / d, uy = dy / d;
                  const fx = ux * overlap * repelK;
                  const fy = uy * overlap * repelK;
                  if (!a.pinned){ a.vx -= fx; a.vy -= fy; }
                  if (!b.pinned){ b.vx += fx; b.vy += fy; }
                }
              }
            }

            for (const n of nodes){
              if (n.pinned) continue;
              n.vx *= damping;
              n.vy *= damping;
              n.vx = clamp(n.vx, -maxV, maxV);
              n.vy = clamp(n.vy, -maxV, maxV);
              n.x += n.vx;
              n.y += n.vy;
              n.x = clamp(n.x, MOON_R + 10, w - (MOON_R + 10));
              n.y = clamp(n.y, MOON_R + 10, h - (MOON_R + 10));
            }
          }
          for (const n of nodes){ n.vx = 0; n.vy = 0; }
        }

        function reset(){
          nodes.length = 0;
          nodeMap.clear();
          hoveredNode = null;
          draggingHub = null;
          draggingNode = null;

          const { w, h } = getSize();
          for (const hub of hubs){
            const p = HUB_LAYOUT[hub.id];
            hub.x = w * p.x;
            hub.y = h * p.y;
          }

          for (const [group, list] of Object.entries(GROUPS)) {
            const hub = hubs.find((h) => h.id === group);
            const count = list.length;
            const orbitRadiusMap = {
              "Algorithms": 84,
              "Data Structures": 84,
              "Interview Practice": 120,
              "Micro Challenges": 122,
              "MCQ Diagnosis": 114,
              "Performance Insights": 128,
              "Coaching": 132
            };
            const orbitR = orbitRadiusMap[group] || 132;

            for (let i=0;i<count;i++){
              const t = list[i];
              const angleOffsetMap = {
                "Algorithms": -1.10,
                "Data Structures": -2.30,
                "Interview Practice": -0.20,
                "Micro Challenges": -2.90,
                "MCQ Diagnosis": 0.20,
                "Performance Insights": 2.72,
                "Coaching": 1.28
              };
              const angle = (Math.PI * 2) * (i / count) + (angleOffsetMap[group] || 0) + rand(-0.08, 0.08);
              const n = {
                text: t,
                cat: group,
                hubRef: hub,
                orbitR,
                angle,
                pinned: false,
                vx: 0,
                vy: 0,
                x: hub.x + Math.cos(angle)*orbitR + rand(-6, 6),
                y: hub.y + Math.sin(angle)*orbitR + rand(-6, 6)
              };
              nodes.push(n);
              nodeMap.set(t, n);
            }
          }

          for (const [group, list] of Object.entries(OUTER_GROUPS)) {
            const hub = hubs.find((h) => h.id === group);
            const count = list.length;
            const outerOrbitRadiusMap = {
              "Algorithms": 132,
              "Data Structures": 136
            };
            const orbitR = outerOrbitRadiusMap[group] || 148;

            for (let i=0;i<count;i++){
              const t = list[i];
              const angleOffsetMap = {
                "Algorithms": 0.55,
                "Data Structures": 0.55
              };
              const angle = (Math.PI * 2) * (i / count) + (angleOffsetMap[group] || 0) + rand(-0.04, 0.04);
              const n = {
                text: t,
                cat: group,
                hubRef: hub,
                orbitR,
                angle,
                pinned: false,
                outer: true,
                vx: 0,
                vy: 0,
                x: hub.x + Math.cos(angle)*orbitR + rand(-4, 4),
                y: hub.y + Math.sin(angle)*orbitR + rand(-4, 4)
              };
              nodes.push(n);
              nodeMap.set(t, n);
            }
          }

          relaxLayout(620);
          scheduleDraw();
        }

        function hitNode(mx,my){
          for (let i=nodes.length-1;i>=0;i--){
            const n = nodes[i];
            if (dist2(mx,my,n.x,n.y) <= (MOON_R+10)*(MOON_R+10)) return n;
          }
          return null;
        }

        function hitHub(mx,my){
          for (let i=hubs.length-1;i>=0;i--){
            const H = hubs[i];
            const radius = hubRadius(H.id);
            if (dist2(mx,my,H.x,H.y) <= (radius+12)*(radius+12)) return H;
          }
          return null;
        }

        function mousePos(e){
          const r = scene.getBoundingClientRect();
          return { x: e.clientX - r.left, y: e.clientY - r.top };
        }

        const onMouseMove = (e)=>{
          const {x,y} = mousePos(e);

          if (draggingNode){
            const { w, h } = getSize();
            const dragMoonR = draggingNode.outer ? (MOON_R - 1) : MOON_R;
            draggingNode.x = clamp(x - dragOffset.x, dragMoonR + 8, w - (dragMoonR + 8));
            draggingNode.y = clamp(y - dragOffset.y, dragMoonR + 8, h - (dragMoonR + 8));
            relaxLayout(24);
            canvas.style.cursor = "grabbing";
            scheduleDraw();
            return;
          }

          if (draggingHub){
            const { w, h } = getSize();
            const radius = hubRadius(draggingHub.id);
            draggingHub.x = clamp(x - dragOffset.x, radius+40, w-(radius+40));
            draggingHub.y = clamp(y - dragOffset.y, radius+40, h-(radius+40));
            relaxLayout(38);
            canvas.style.cursor = "grabbing";
            scheduleDraw();
            return;
          }

          hoveredNode = hitNode(x,y);
          if (hitHub(x,y)) canvas.style.cursor = "grab";
          else if (hoveredNode) canvas.style.cursor = "grab";
          else canvas.style.cursor = "default";
          scheduleDraw();
        };

        const onMouseDown = (e)=>{
          const {x,y} = mousePos(e);
          const n = hitNode(x,y);
          if (n){
            draggingNode = n;
            dragOffset = { x: x - n.x, y: y - n.y };
            canvas.style.cursor = "grabbing";
            scheduleDraw();
            return;
          }
          const h = hitHub(x,y);
          if (h){
            draggingHub = h;
            dragOffset = { x: x - h.x, y: y - h.y };
            canvas.style.cursor = "grabbing";
            scheduleDraw();
          }
        };

        const onMouseUp = ()=>{
          draggingHub = null;
          draggingNode = null;
          canvas.style.cursor = "default";
          relaxLayout(120);
          scheduleDraw();
        };

        const onClick = (e)=>{
          const {x,y} = mousePos(e);
          const n = hitNode(x,y);
          if (!n) return;
          n.pinned = !n.pinned;
          relaxLayout(80);
          scheduleDraw();
        };

        const onDbl = ()=> reset();

        scene.addEventListener("mousemove", onMouseMove);
        scene.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        scene.addEventListener("click", onClick);
        scene.addEventListener("dblclick", onDbl);

        this._cleanup.push(() => scene.removeEventListener("mousemove", onMouseMove));
        this._cleanup.push(() => scene.removeEventListener("mousedown", onMouseDown));
        this._cleanup.push(() => window.removeEventListener("mouseup", onMouseUp));
        this._cleanup.push(() => scene.removeEventListener("click", onClick));
        this._cleanup.push(() => scene.removeEventListener("dblclick", onDbl));

        function drawConnections(){
          const usingFocus = !!hoveredNode;

          // Group-to-group structure lines (inter-group)
          for (const [ga, gb] of GROUP_LINKS) {
            const A = hubs.find((h) => h.id === ga);
            const B = hubs.find((h) => h.id === gb);
            if (!A || !B) continue;

            const alpha = usingFocus
              ? 0.20
              : 0.24;

            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.lineWidth = 1.7;
            ctx.strokeStyle = `rgba(246,213,138,${alpha})`;
            ctx.stroke();
          }

          // Group-to-node spokes (intra-group)
          for (const n of nodes) {
            const alpha = usingFocus
              ? ((hoveredNode.text === n.text || isEdge(hoveredNode.text, n.text)) ? 0.48 : 0.12)
              : 0.24;
            ctx.beginPath();
            ctx.moveTo(n.hubRef.x, n.hubRef.y);
            ctx.lineTo(n.x, n.y);
            ctx.lineWidth = 1.05;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.stroke();
          }

          // Topic-to-topic links with stronger distinction between intra-group and inter-group
          for (const [a,b] of edges){
            const A = nodeMap.get(a);
            const B = nodeMap.get(b);
            if (!A || !B) continue;

            const sameGroup = A.cat === B.cat;
            const connectedToHover = usingFocus
              ? (hoveredNode.text === a || hoveredNode.text === b || isEdge(hoveredNode.text, a) || isEdge(hoveredNode.text, b))
              : false;

            const alpha = usingFocus
              ? (connectedToHover ? (sameGroup ? 0.50 : 0.64) : 0.06)
              : (sameGroup ? 0.16 : 0.24);

            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.lineWidth = connectedToHover
              ? (sameGroup ? 1.55 : 1.9)
              : (sameGroup ? 1.0 : 1.25);
            ctx.strokeStyle = sameGroup
              ? `rgba(185,140,255,${alpha})`
              : `rgba(246,213,138,${alpha})`;
            ctx.stroke();
          }
        }

        function draw(){
          const { w, h } = getSize();
          if (w <= 1 || h <= 1) return;

          ctx.clearRect(0,0,w,h);
          drawConnections();
          for (const hub of hubs) drawHub(hub);

          const usingFocus = !!hoveredNode;
          function alphaForNode(n){
            if (!usingFocus) return 1;
            if (hoveredNode.text === n.text) return 1;
            return isEdge(hoveredNode.text, n.text) ? 1 : 0.16;
          }

          for (const n of nodes){
            const highlight = hoveredNode && hoveredNode.text === n.text;
            drawMoon(n, alphaForNode(n), highlight, n.pinned);
          }
        }

        const resize = ()=>{
          const { w, h } = getSize();
          if (w <= 1 || h <= 1) return;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.max(1, Math.floor(w * dpr));
          canvas.height = Math.max(1, Math.floor(h * dpr));
          ctx.setTransform(dpr,0,0,dpr,0,0);
          draw();
        };

        this._resizeFn = resize;

        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => {
            const r = scene.getBoundingClientRect();
            if (r.width > 1 && r.height > 1) resize();
          });
          ro.observe(scene);
          this._cleanup.push(() => ro.disconnect());
        } else {
          const onWinResize = () => resize();
          window.addEventListener("resize", onWinResize);
          this._cleanup.push(() => window.removeEventListener("resize", onWinResize));
        }

        window.constellationResize = () => this.resize();
        window.constellationResize.__owner = this;

        requestAnimationFrame(() => {
          resize();
          reset();
          draw();
        });
      }
    }

    if (!customElements.get("codivium-constellation")) {
      customElements.define("codivium-constellation", CodiviumConstellation);
    }
  })();