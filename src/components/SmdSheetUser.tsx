import CheckModels from "./smd_Sheet/CheckModels"
import PQCChecks from "./smd_Sheet/PQCChecks"
import ProgramChecks from "./smd_Sheet/ProgramChecks"
import SheetHeader from "./smd_Sheet/SheetHeader"
import StandardProductionSection from "./smd_Sheet/StandardProductions"
import StandardVehicles from "./smd_Sheet/StandardVehicles"
import TimeChangeModels from "./smd_Sheet/TimeChangeModels"
const SmdSheetUser = () => {
  return (
    <div>
        <SheetHeader />
        <CheckModels />
        <ProgramChecks />
        <StandardProductionSection />
        <TimeChangeModels />
        <StandardVehicles />
        <PQCChecks />
    </div>
  )
}

export default SmdSheetUser