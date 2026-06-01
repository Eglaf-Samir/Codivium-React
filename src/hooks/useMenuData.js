import { useState, useEffect, useCallback } from "react";
import { Getallinterviewpreprationfiltering } from "../api/interviewprepration/apiinterviewprepration";
import { GetalldeliberatePracticefiltering } from "../api/deliberatePractice/apideliberatepractice";
import { GetCategoriesByMode, GetallDifficultyLevel, GetallCategory } from "../api/mcq/apimcq";
import { ParamMasterKey } from "../config";

const DEMO_DATA = {
  track: "micro",
  trackLabel: "Micro Challenge Menu",
  categories: ["Arrays", "Strings", "Stacks", "Trees", "Dynamic Programming"],
  difficultyLevels: ["beginner", "intermediate", "advanced"],
  exerciseTypes: ["Implementation", "Analytical", "Debugging", "Design"],
  mentalModels: [],
  exercises: [],
};

const COMPLETION_OPTIONS = [
  { id: 1, name: "Completed" },
  { id: 2, name: "Not Completed" },
];

function statusFromItem(item) {
  if (item?.isCompleted && !item?.isSubmitted) return "completed";
  if (item?.isSubmitted) return "attempted";
  return "not_started";
}

function mapExercise(item) {
  return {
    id: item.id,
    name: item.title || item.name || "",
    shortDescription: item.description || item.shortDescription || "",
    category: item.categories?.name || item.category || "",
    difficulty: (
      item.difficultyLevel?.description ||
      item.difficultyLevel?.name ||
      item.difficulty ||
      ""
    ).toLowerCase(),
    completionStatus: statusFromItem(item),
    completedAt: item.completedAt || null,
    exerciseType:
      item.exerciseType || (item.isCoding ? "Coding" : "Non-Coding"),
    mentalModels: item.mentalModels || [],
    fontAwesomeIcon: item.fontAwesomeIcon,
    isCoding: item.isCoding,
    isFree: item.isFree ?? item.IsFree ?? false,
    raw: item,
  };
}

export function useMenuData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [difficultyOptions, setDifficultyOptions] = useState([]);
  const [exerciseTypeOptions, setExerciseTypeOptions] = useState([]);
  const [mentalModelOptions, setMentalModelOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [optionsReady, setOptionsReady] = useState(false);

  const track = (
    new URLSearchParams(window.location.search).get("track") || "micro"
  ).toLowerCase();

  useEffect(() => {
    let cancelled = false;
    const mode = track === "interview" ? "INTERVIEW" : "DELIBERATION";
    const isMicro = track !== "interview";
    setOptionsReady(false);
    (async () => {
      try {
        const requests = [
          GetCategoriesByMode(mode),
          GetallDifficultyLevel(ParamMasterKey.DifficultyLevel),
        ];
        if (isMicro) {
          requests.push(GetallDifficultyLevel(ParamMasterKey.ExerciseType));
          requests.push(GetallDifficultyLevel(ParamMasterKey.MentalModel));
          requests.push(GetallDifficultyLevel(ParamMasterKey.Area));
        }
        const results = await Promise.all(requests);
        if (cancelled) return;
        const [catRes, diffRes, exTypeRes, mentalRes, areaRes] = results;
        if (catRes?.status === 200 && Array.isArray(catRes.data)) {
          setCategoryOptions(catRes.data);
        }
        if (diffRes?.status === 200 && Array.isArray(diffRes.data)) {
          setDifficultyOptions(
            [...diffRes.data].sort((a, b) => a.id - b.id),
          );
        }
        if (isMicro) {
          if (exTypeRes?.status === 200 && Array.isArray(exTypeRes.data)) {
            setExerciseTypeOptions(exTypeRes.data);
          } else {
            setExerciseTypeOptions([]);
          }
          if (mentalRes?.status === 200 && Array.isArray(mentalRes.data)) {
            setMentalModelOptions(mentalRes.data);
          } else {
            setMentalModelOptions([]);
          }
          if (areaRes?.status === 200 && Array.isArray(areaRes.data)) {
            setAreaOptions(areaRes.data);
          } else {
            setAreaOptions([]);
          }
          // SubCategory options are NOT loaded here — they depend on the
          // selected category(ies) and are fetched on demand via
          // loadSubCategories() (see below), mirroring the admin behaviour.
        } else {
          setExerciseTypeOptions([]);
          setMentalModelOptions([]);
          setAreaOptions([]);
          setSubCategoryOptions([]);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        if (!cancelled) setOptionsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [track]);

  // Load subcategories for the given parent category id(s). SubCategory options
  // are category-dependent: only the subcategories belonging to the selected
  // categories (or all categories when none picked) are shown — same rule the
  // category filter follows. Results are merged + de-duped across categories.
  const loadSubCategories = useCallback(async (categoryIds) => {
    const ids = (categoryIds || []).filter((v) => v != null && v !== "");
    if (ids.length === 0) {
      setSubCategoryOptions([]);
      return;
    }
    try {
      const results = await Promise.all(ids.map((id) => GetallCategory(id, "")));
      const seen = new Set();
      const merged = [];
      results.forEach((res) => {
        if (res?.status === 200 && Array.isArray(res.data)) {
          res.data.forEach((sc) => {
            if (sc && !seen.has(sc.id)) {
              seen.add(sc.id);
              merged.push(sc);
            }
          });
        }
      });
      setSubCategoryOptions(merged);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      setSubCategoryOptions([]);
    }
  }, []);

  const runFilter = useCallback(
    async (filterBody) => {
      setLoading(true);
      setError(null);

      if (window.__CODIVIUM_MENU_DATA__) {
        setData(window.__CODIVIUM_MENU_DATA__);
        setLoading(false);
        return;
      }

      if (window.__CODIVIUM_DEMO__) {
        setData(DEMO_DATA);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("LoginToken");
      if (!token) {
        setData(DEMO_DATA);
        setLoading(false);
        return;
      }

      try {
        const body = filterBody || {};
        const filters = {
          DifficultyLabels: (body.DifficultyLabels || [])
            .map((v) => Number(v))
            .filter((n) => !Number.isNaN(n)),
          CategoryIds: (body.CategoryIds || [])
            .map((v) => Number(v))
            .filter((n) => !Number.isNaN(n)),
          SubCategoryIds: (body.SubCategoryIds || [])
            .map((v) => Number(v))
            .filter((n) => !Number.isNaN(n)),
          AreaIds: (body.AreaIds || [])
            .map((v) => Number(v))
            .filter((n) => !Number.isNaN(n)),
          CompletionIds: (body.CompletionIds || [])
            .map((v) => Number(v))
            .filter((n) => !Number.isNaN(n)),
          SortOrder: body.SortOrder || "ASC",
        };

        console.log("useMenuData filters →", filters);

        const res =
          track === "interview"
            ? await Getallinterviewpreprationfiltering(filters)
            : await GetalldeliberatePracticefiltering(filters);

        if (!res || res.status >= 400) {
          throw new Error(`HTTP ${res?.status || "error"}`);
        }

        const raw = res.data?.data ?? res.data ?? [];
        const items = Array.isArray(raw)
          ? raw
          : raw.exercises || raw.list || [];
        const exercises = items.map(mapExercise);

        setData({
          track,
          trackLabel:
            track === "interview"
              ? "Interview Questions Menu"
              : "Micro Challenge Menu",
          exercises,
        });
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [track],
  );

  return {
    data,
    loading,
    error,
    reload: () => runFilter({}),
    runFilter,
    DEMO_DATA,
    categoryOptions,
    difficultyOptions,
    exerciseTypeOptions,
    mentalModelOptions,
    areaOptions,
    subCategoryOptions,
    loadSubCategories,
    completionOptions: COMPLETION_OPTIONS,
    optionsReady,
  };
}
