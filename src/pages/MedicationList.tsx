import { useState } from "react";
import { useMedications } from "@/network/medicationlist";
import { MedicationListType } from "@/types/medicationType";

export default function MedicationList() {
  const {
    medications,
    loading,
    toggleAll,
    toggleExpand,
    handleCheckboxChange,
    handleInputChange,
    toggleEditMode,
    deleteMedication,
    addMedication,
  } = useMedications();

  const [isAllExpanded, setIsAllExpanded] = useState(true);

  const handleToggleAllClick = (expandState: boolean) => {
    toggleAll(expandState);
    setIsAllExpanded(!expandState);
  };

  return (
    <div className="min-h-screen bg-base-200 flex justify-center items-start p-4 sm:p-10 font-sans antialiased text-neutral">
      <div className="w-full max-w-3xl bg-base-100 border border-base-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        {/* Navigation & Actions Header */}
        <header className="navbar bg-neutral/95 backdrop-blur-md text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap gap-4 justify-between items-center border border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-secondary">
              Medication List
            </span>
            <button
              className="btn btn-xs btn-circle font-black text-sm bg-primary border-none text-white shadow-md transition-all duration-300 hover:scale-110 hover:rotate-90 cursor-pointer"
              onClick={addMedication}
              title="Add Medication"
            >
              +
            </button>
          </div>

          <nav className="flex items-center gap-5 text-sm font-semibold tracking-wider uppercase">
            <button
              onClick={() => handleToggleAllClick(isAllExpanded)}
              className="hover:text-secondary transition-colors cursor-pointer duration-200 text-white/90"
            >
              {isAllExpanded ? "Open all" : "Close all"}
            </button>
            <button className="hover:text-secondary transition-colors cursor-pointer duration-200 text-white/90">
              Home
            </button>
            <button className="hover:text-error transition-colors cursor-pointer duration-200 font-bold tracking-widest">
              Log out
            </button>
          </nav>
        </header>

        {/* Core List Layout Container */}
        <main className="space-y-5">
          {/* 1. Loading State Placeholder */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-sm font-medium text-neutral/50 tracking-wide">
                Retrieving medication registry records...
              </p>
            </div>
          )}

          {/* 2. Empty State Message Display */}
          {!loading && medications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-base-300 rounded-2xl bg-base-200/20 text-center space-y-4">
              <div className="text-4xl select-none opacity-40">📋</div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-neutral tracking-wide">
                  No Medications Registered
                </h3>
                <p className="text-xs sm:text-sm text-neutral/60 max-w-sm font-medium">
                  Your current schedule tracker is empty. Click the "+" button
                  in the header above to log your first treatment asset.
                </p>
              </div>
              <button
                onClick={addMedication}
                className="btn btn-sm btn-primary rounded-xl font-bold tracking-wider px-4 cursor-pointer text-white shadow-sm"
              >
                Create Entry
              </button>
            </div>
          )}

          {/* 3. Core Mapping List */}
          {!loading &&
            medications.map((med) => (
              <section
                key={med.id}
                className={`border transition-all duration-300 rounded-2xl overflow-hidden bg-base-100 ${
                  med.isExpanded
                    ? "border-primary/40 shadow-lg scale-[1.01]"
                    : "border-base-200 hover:border-primary/30 hover:shadow-md"
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between p-5 gap-4 bg-linear-to-r from-base-200/50 to-base-100 border-b border-base-200">
                  <div className="flex items-center gap-4 w-full max-w-xl">
                    <button
                      onClick={() => toggleExpand(med.id)}
                      className={`btn btn-ghost btn-xs btn-circle bg-base-200/60 hover:bg-base-200 transition-all duration-300 text-neutral font-bold ${
                        med.isExpanded ? "rotate-180" : "rotate-90"
                      }`}
                    >
                      ▲
                    </button>

                    {med.isEditing ? (
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) =>
                          handleInputChange(med.id, "name", e.target.value)
                        }
                        placeholder="Medication Name"
                        className="input input-sm h-10 rounded-xl w-full font-bold focus:outline-primary text-neutral bg-base-100 border border-base-200 px-4 shadow-inner"
                      />
                    ) : (
                      <span
                        onClick={() => toggleExpand(med.id)}
                        className="font-bold text-base text-neutral tracking-wide cursor-pointer hover:text-primary transition-colors select-none duration-200"
                      >
                        {med.name}
                      </span>
                    )}
                  </div>

                  {!med.isExpanded && (
                    <span className="badge bg-accent text-neutral font-semibold tracking-wide border-none rounded-lg px-3 py-2.5 text-xs">
                      {med.dosage || "No Dose"}
                    </span>
                  )}
                </div>

                {/* Collapsible Details Body */}
                {med.isExpanded && (
                  <div className="p-6 space-y-6 bg-base-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Dosage Field */}
                      <div className="form-control w-full md:col-span-1">
                        <label className="label pt-0 pb-1.5">
                          <span className="label-text font-bold text-xs uppercase tracking-widest text-neutral/65">
                            Dosage
                          </span>
                        </label>
                        {med.isEditing ? (
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) =>
                              handleInputChange(
                                med.id,
                                "dosage",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 20 mg"
                            className="input rounded-xl w-full bg-base-100 focus:outline-primary text-sm text-neutral border border-base-200 h-10 px-3 shadow-inner"
                          />
                        ) : (
                          <div className="h-10 flex items-center px-4 bg-base-200/40 border border-base-200 rounded-xl font-bold text-neutral/80 text-sm">
                            {med.dosage || (
                              <span className="italic font-normal opacity-40">
                                Not defined
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Planned Effect Field */}
                      <div className="form-control w-full md:col-span-2">
                        <label className="label pt-0 pb-1.5">
                          <span className="label-text font-bold text-xs uppercase tracking-widest text-neutral/65">
                            Planned Medical Effect
                          </span>
                        </label>
                        {med.isEditing ? (
                          <input
                            type="text"
                            value={med.effect}
                            onChange={(e) =>
                              handleInputChange(
                                med.id,
                                "effect",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Mood stabilization"
                            className="input rounded-xl w-full bg-base-100 focus:outline-primary text-sm text-neutral border border-base-200 h-10 px-3 shadow-inner"
                          />
                        ) : (
                          <div className="h-10 flex items-center px-4 bg-base-200/40 border border-base-200 rounded-xl font-medium text-neutral/80 text-sm">
                            {med.effect || (
                              <span className="italic opacity-40 font-normal">
                                No target effect specified
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Intake Slots Container */}
                    <div className="form-control bg-base-200/30 p-5 rounded-2xl border border-base-200 shadow-inner">
                      <label className="label pt-0 pb-3">
                        <span className="label-text font-bold text-xs uppercase tracking-widest text-neutral/70">
                          {med.isEditing
                            ? "Schedule Configuration (Select Active Slots)"
                            : "Active Intake Slots"}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-6 items-center">
                        {(
                          Object.keys(med.schedule) as Array<
                            keyof MedicationListType["schedule"]
                          >
                        ).map((slot) => {
                          const isActive = med.schedule[slot];
                          return (
                            <label
                              key={slot}
                              className={`flex items-center gap-2 select-none text-sm font-semibold capitalize ${
                                med.isEditing
                                  ? "cursor-pointer"
                                  : "pointer-events-none"
                              } ${isActive ? "text-neutral" : "text-neutral/40"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                disabled={!med.isEditing}
                                onChange={() =>
                                  handleCheckboxChange(med.id, slot)
                                }
                                className="checkbox checkbox-primary checkbox-sm rounded-md transition-all"
                              />
                              <span>{slot}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operational Footer Controls */}
                    <div className="flex justify-end items-center gap-4 pt-2 border-t border-base-200/60">
                      <button
                        onClick={() => toggleEditMode(med.id)}
                        className={`btn btn-sm rounded-xl px-5 font-bold tracking-wider cursor-pointer shadow-sm border ${
                          med.isEditing
                            ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                            : "bg-base-200 text-neutral border-base-300 hover:bg-base-300"
                        }`}
                      >
                        {med.isEditing ? "SAVE" : "EDIT"}
                      </button>
                      <button
                        onClick={() => deleteMedication(med.id)}
                        className="btn btn-sm btn-ghost text-rose-600 font-bold tracking-wider hover:bg-rose-50 rounded-xl px-4 cursor-pointer"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ))}
        </main>
      </div>
    </div>
  );
}
