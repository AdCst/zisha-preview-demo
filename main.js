import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

// DOM 元素
const container = document.getElementById('viewer');

// 1. 基础场景配置（改进灯光以适应粗糙模型）
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// 相机（调整初始位置以更好地观察模型）
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  200
);
camera.position.set(0, 5, 15); // 从正面稍上方看，适合各种模型
camera.lookAt(0, 0, 0);

// 渲染器（保持透明支持）
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// 2. 灯光（增强以适应粗糙模型）
scene.add(new THREE.AmbientLight(0xffffff, 3));
const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(5, 10, 5);
scene.add(dirLight1);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
dirLight2.position.set(-5, 10, -5);
scene.add(dirLight2);

// 3. 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// 4. 加载器
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// 全局变量
let currentModel = null;
let decalMesh = null;
let mainMesh = null;

// ===============================
// 加载模型（统一缩放）
// ===============================
function loadModel(url) {
  // 清空旧模型
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  // **关键：彻底清除旧贴花**（防止残留）
  if (decalMesh) {
    scene.remove(decalMesh);
    decalMesh.geometry.dispose();
    decalMesh.material.dispose();
    decalMesh = null;
  }

  // 重置 mainMesh（很重要！新模型要重新找主 mesh）
  mainMesh = null;

  gltfLoader.load(url, (gltf) => {
    const model = gltf.scene;

    // 统一缩放
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    model.scale.set(20 / maxDim, 20 / maxDim, 20 / maxDim);
    model.position.set(0, -5, 0);

    scene.add(model);
    currentModel = model;

    // 重新查找主 mesh（每个模型都要重新找）
    model.traverse((child) => {
      if (child.isMesh && !mainMesh) {
        mainMesh = child;  // 取第一个 mesh 作为主壶身
      }
    });

    // 调试轴线（可选）
     const axesHelper = new THREE.AxesHelper(15);
     scene.add(axesHelper);

    controls.update();
  });
}

// ===============================
// 核心：贴PNG
// ===============================
function applyDecal(imageUrl) {
  if (!currentModel || !mainMesh) {
    alert('请先加载模型！');
    return;
  }

  // 移除旧贴花
  if (decalMesh) scene.remove(decalMesh);

  textureLoader.load(
    imageUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      const decalMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,   // 防止闪烁
        depthWrite: false          // 防止z-fighting
      });

      // 位置：
      const pos = new THREE.Vector3(10, 1, 1);  

      // 旋转：面向壶身正面（Y轴旋转90度，让投影正对曲面）
      const rot = new THREE.Euler(0, Math.PI/2, 0);

      // 尺寸：x，y覆盖壶身面积；z增加深度，让投影穿透曲面
      const size = new THREE.Vector3(15, 15, 20);  

      // 创建贴花几何
      const decalGeo = new DecalGeometry(mainMesh, pos, rot, size);
      decalMesh = new THREE.Mesh(decalGeo, decalMaterial);
      scene.add(decalMesh);

      renderer.render(scene, camera);
    },
    undefined,
    (err) => console.error('贴图加载失败：', err)
  );
}

// ===============================
// 上色
// ===============================
function changeModelColor(colorHex) {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: new THREE.Color(colorHex).multiplyScalar(0.2),
        emissiveIntensity: 0.5,
        roughness: 0.5
      });
    }
  });
}

// ===============================
// 事件绑定
// ===============================
document.querySelectorAll('.model-btns button').forEach(btn => {
  btn.addEventListener('click', () => loadModel(btn.dataset.model));
});
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => changeModelColor(btn.dataset.color));
});
document.querySelectorAll('.pattern-btn').forEach(btn => {
  btn.addEventListener('click', () => applyDecal(btn.dataset.pattern));
});

// ===============================
// 渲染循环
// ===============================
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// 窗口调整
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// 默认加载
loadModel('models/model1.glb');