'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Database, PencilLine, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createSpecification } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import {
  SpecificationResponse,
  SpecificationDataset,
  SpecificationEntity,
  SpecificationEntityAttribute
} from '@/lib/types'
import { SpecificationForm } from '@/app/(main)/teacher/specifications/components/specification-form'
import { PATH } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface SpecificationsViewProps {
  initialSpecifications: SpecificationResponse[]
}

export function SpecificationsView({
  initialSpecifications
}: SpecificationsViewProps) {
  const { callApi, isLoading } = useApi()
  const [specifications, setSpecifications] = useState(initialSpecifications)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [ddlScript, setDdlScript] = useState('')
  const [description, setDescription] = useState('')
  const [entities, setEntities] = useState<SpecificationEntity[]>([])
  const [datasets, setDatasets] = useState<SpecificationDataset[]>([])

  const emptyAttribute = (
    orderIndex: number
  ): SpecificationEntityAttribute => ({
    attributeName: '',
    dataType: 'VARCHAR(255)',
    description: '',
    isPrimaryKey: false,
    isNullable: true,
    orderIndex
  })

  const emptyEntity = (orderIndex: number): SpecificationEntity => ({
    entityName: '',
    displayName: '',
    description: '',
    orderIndex,
    attributes: [emptyAttribute(1)]
  })

  const normalizeEntities = (items: SpecificationEntity[]) =>
    items.map((entity, entityIndex) => ({
      ...entity,
      entityName: entity.entityName.trim(),
      displayName: entity.displayName?.trim() || entity.entityName.trim(),
      description: entity.description?.trim() || '',
      orderIndex: entityIndex + 1,
      attributes: (entity.attributes ?? []).map((attribute, attrIndex) => ({
        ...attribute,
        attributeName: attribute.attributeName.trim(),
        dataType: attribute.dataType.trim(),
        description: attribute.description?.trim() || '',
        orderIndex: attrIndex + 1
      }))
    }))

  const normalizeDatasets = (items: SpecificationDataset[]) =>
    items.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      orderIndex: index + 1
    }))

  const addEntity = () => {
    setEntities((prev) => [...prev, emptyEntity(prev.length + 1)])
  }

  const removeEntity = (entityIndex: number) => {
    setEntities((prev) =>
      normalizeEntities(prev.filter((_, idx) => idx !== entityIndex))
    )
  }

  const moveEntity = (entityIndex: number, direction: -1 | 1) => {
    setEntities((prev) => {
      const target = entityIndex + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[entityIndex], next[target]] = [next[target], next[entityIndex]]
      return normalizeEntities(next)
    })
  }

  const updateEntity = (
    entityIndex: number,
    field: keyof SpecificationEntity,
    value: string
  ) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex ? { ...entity, [field]: value } : entity
      )
    )
  }

  const addAttribute = (entityIndex: number) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: [
                ...(entity.attributes ?? []),
                emptyAttribute((entity.attributes ?? []).length + 1)
              ]
            }
          : entity
      )
    )
  }

  const updateAttribute = (
    entityIndex: number,
    attributeIndex: number,
    field: keyof SpecificationEntityAttribute,
    value: string | boolean | number
  ) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: (entity.attributes ?? []).map((attribute, aIdx) =>
                aIdx === attributeIndex
                  ? { ...attribute, [field]: value }
                  : attribute
              )
            }
          : entity
      )
    )
  }

  const removeAttribute = (entityIndex: number, attributeIndex: number) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: (entity.attributes ?? [])
                .filter((_, aIdx) => aIdx !== attributeIndex)
                .map((attribute, aIdx) => ({
                  ...attribute,
                  orderIndex: aIdx + 1
                }))
            }
          : entity
      )
    )
  }

  const addDataset = () => {
    setDatasets((prev) => [
      ...prev,
      {
        name: '',
        dataScript: '',
        orderIndex: prev.length + 1,
        isActive: true
      }
    ])
  }

  const updateDataset = (
    index: number,
    field: keyof SpecificationDataset,
    value: string | boolean | number
  ) => {
    setDatasets((prev) =>
      prev.map((dataset, idx) =>
        idx === index ? { ...dataset, [field]: value } : dataset
      )
    )
  }

  const removeDataset = (index: number) => {
    setDatasets((prev) =>
      normalizeDatasets(prev.filter((_, idx) => idx !== index))
    )
  }

  const moveDataset = (index: number, direction: -1 | 1) => {
    setDatasets((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return normalizeDatasets(next)
    })
  }

  const resetForm = () => {
    setName('')
    setDdlScript('')
    setDescription('')
    setEntities([])
    setDatasets([])
    setShowForm(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !ddlScript.trim()) {
      toast.error('Vui lòng nhập tên và DDL script')
      return
    }

    const normalizedEntities = normalizeEntities(entities)
    const invalidEntity = normalizedEntities.find(
      (entity) => !entity.entityName
    )
    if (invalidEntity) {
      toast.error('Vui lòng nhập entityName cho tất cả entities')
      return
    }

    const invalidAttribute = normalizedEntities.find((entity) =>
      (entity.attributes ?? []).some(
        (attribute) => !attribute.attributeName || !attribute.dataType
      )
    )
    if (invalidAttribute) {
      toast.error('Vui lòng nhập đầy đủ attributeName và dataType')
      return
    }

    const normalizedDatasets = normalizeDatasets(datasets)
    const invalidDataset = normalizedDatasets.find((dataset) => !dataset.name)
    if (invalidDataset) {
      toast.error('Vui lòng nhập tên cho tất cả datasets')
      return
    }

    const result = await callApi(
      createSpecification({
        name: name.trim(),
        ddlScript,
        description: description.trim() || undefined,
        entities: normalizedEntities,
        datasets: normalizedDatasets
      })
    )

    if (result.data) {
      setSpecifications((prev) => [...prev, result.data!])
      resetForm()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Đặc Tả CSDL
          </h1>
          <p className="text-muted-foreground">
            Quản lý đặc tả CSDL cho bài thi
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo đặc tả CSDL
          </Button>
        )}
      </div>

      {showForm && (
        <SpecificationForm
          mode="create"
          isLoading={isLoading}
          name={name}
          ddlScript={ddlScript}
          description={description}
          entities={entities}
          datasets={datasets}
          onNameChange={setName}
          onDdlScriptChange={setDdlScript}
          onDescriptionChange={setDescription}
          onSubmit={handleCreate}
          onCancel={resetForm}
          onAddEntity={addEntity}
          onRemoveEntity={removeEntity}
          onMoveEntity={moveEntity}
          onUpdateEntity={updateEntity}
          onAddAttribute={addAttribute}
          onUpdateAttribute={updateAttribute}
          onRemoveAttribute={removeAttribute}
          onAddDataset={addDataset}
          onUpdateDataset={updateDataset}
          onRemoveDataset={removeDataset}
          onMoveDataset={moveDataset}
        />
      )}

      {specifications.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Database className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Chưa có đặc tả CSDL nào
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo đặc tả CSDL đầu tiên để sử dụng trong bài thi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {specifications.map((spec) => (
            <div
              key={spec.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {spec.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {spec.createdAt ? formatDate(spec.createdAt) : '-'}
              </p>

              {spec.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {spec.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end">
                <Link href={PATH.TEACHER_SPECIFICATION_EDIT(spec.id)}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Chỉnh sửa đặc tả CSDL"
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
