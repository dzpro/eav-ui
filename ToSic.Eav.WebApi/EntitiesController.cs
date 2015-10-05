﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using ToSic.Eav.DataSources;
using ToSic.Eav.Persistence;
using ToSic.Eav.WebApi.Formats;
using ToSic.Eav.Import;
using ToSic.Eav.BLL;
using ToSic.Eav.ImportExport.Refactoring.Extensions;

namespace ToSic.Eav.WebApi
{
	/// <summary>
	/// Web API Controller for various actions
	/// </summary>
	public class EntitiesController : Eav3WebApiBase
    {
        public EntitiesController(int appId) : base(appId) { }
        public EntitiesController() : base() { }

        #region GetOne GetAll calls
        internal IEntity GetEntityOrThrowError(string contentType, int id, int? appId = null)
        {
            if (appId.HasValue)
                AppId = appId.Value;

            // must use cache, because it shows both published  unpublished
            var found = DataSource.GetCache(null, appId).List[id];
            if (contentType != null && !(found.Type.Name == contentType || found.Type.StaticName == contentType))
                throw new KeyNotFoundException("Can't find " + id + "of type '" + contentType + "'");
            return found;
        }

        public Dictionary<string, object> GetOne(string contentType, int id, int? appId = null, string cultureCode = null)
	    {
            var found = GetEntityOrThrowError(contentType, id, appId);
            return Serializer.Prepare(found);
	    }

        /// <summary>
		/// Get all Entities of specified Type
		/// </summary>
		public IEnumerable<Dictionary<string, object>> GetEntities(string contentType, string cultureCode = null, int? appId = null)
		{
            if (appId.HasValue)
                AppId = appId.Value;

			var typeFilter = DataSource.GetDataSource<EntityTypeFilter>(appId: appId, upstream: InitialDS);
			typeFilter.TypeName = contentType;

            return Serializer.Prepare(typeFilter.LightList);//  typeFilter.List.Select(t => Helpers.GetEntityValues(t.Value, cultureCode: cultureCode));
		}

	    public IEnumerable<Dictionary<string, object>> GetAllOfTypeForAdmin(int appId, string contentType)
	    {
	        SetAppIdAndUser(appId);
	        var ds = InitialDS;

            var typeFilter = DataSource.GetDataSource<EntityTypeFilter>(appId: appId, upstream: ds.Cache, valueCollectionProvider: ds.ConfigurationProvider); // need to go to cache, to include published & unpublished
            typeFilter.TypeName = contentType;

            Serializer.IncludeGuid = true;
	        Serializer.IncludePublishingInfo = true;
	        Serializer.IncludeMetadata = true;

            return Serializer.Prepare(typeFilter.LightList);
        }

        //2015-08-29 2dm: these commands are kind of ready, but not in use yet
        /// <summary>
        /// Get all Entities of specified Type
        /// </summary>
     //   public IEnumerable<Dictionary<string, object>> GetEntitiesByType(int appId, string contentType, int pageSize = 1000, int pageNumber = 1)
     //   {
     //       AppId = appId;

     //       var typeFilter = DataSource.GetDataSource<EntityTypeFilter>(appId: appId, upstream: InitialDS);
     //       typeFilter.TypeName = contentType;
     //       var paging = DataSource.GetDataSource<Paging>(upstream: typeFilter);
     //       paging.PageNumber = pageNumber;
     //       paging.PageSize = pageSize;

     //       return Serializer.Prepare(paging.LightList);//  typeFilter.List.Select(t => Helpers.GetEntityValues(t.Value, cultureCode: cultureCode));
     //   }

	    //public int CountEntitiesOfType(int appId, string contentType)
	    //{
     //       AppId = appId;

     //       var typeFilter = DataSource.GetDataSource<EntityTypeFilter>(appId: appId, upstream: InitialDS);
     //       typeFilter.TypeName = contentType;
	    //    return typeFilter.LightList.Count();
	    //}

        public EntityWithLanguages GetOne(int appId, string contentType, int id, string format = "multi-language")
        {
            switch (format)
            {
                case "multi-language":
                    Serializer.IncludeAllEditingInfos = true;

                    var found = GetEntityOrThrowError(contentType, id, appId);
                    var maybeDraft = found.GetDraft();
                    if (maybeDraft != null)
                        found = maybeDraft;
                    //return Serializer.Prepare(found);

                    var ce = new EntityWithLanguages()
                    {
                        AppId = appId,
                        Id = found.EntityId,
                        Guid = found.EntityGuid,
                        Type = new Formats.Type() { Name = found.Type.Name, StaticName = found.Type.StaticName },
                        IsPublished = found.IsPublished,
                        TitleAttributeName = found.Title == null ? null : found.Title.Name,
                        Attributes = found.Attributes.ToDictionary(a => a.Key, a => new Formats.Attribute()
                            {
                                Values = a.Value.Values == null ? new ValueSet[0] : a.Value.Values.Select(v => new Formats.ValueSet()
                                {
                                    Value = v.SerializableObject,  //v.Serialized, // Data.Value.GetValueModel(a.Value.Type, v., //
                                    Dimensions = v.Languages.ToDictionary(l => l.Key, y => y.ReadOnly)
                                }).ToArray()
                            }
                        )
                    };
                    return ce;
                default:
                    throw new Exception("format: " + format + " unknown");
            }
        }

        [HttpPost]
        public List<EntityWithHeader> GetManyForEditing([FromUri]int appId, [FromBody]List<ItemIdentifier> items)
        {
            return items.Select(p => new EntityWithHeader
            {
                Header = p,
                Entity = p.EntityId != 0 ? GetOne(appId, p.ContentTypeName, p.EntityId) : null
            }).ToList();
        }


        #endregion


        [HttpPost]
        public bool SaveMany([FromUri] int appId, [FromBody] List<EntityWithHeader> items)
        { 
            var convertedItems = new List<ImportEntity>();
            foreach (var entity in items)
                convertedItems.Add(CreateImportEntity(entity, appId));

            // Run import
            var import = new Import.Import(null, appId, User.Identity.Name, 
                leaveExistingValuesUntouched: false, 
                preserveUndefinedValues: false,
                preventDraftSave: false);
            import.RunImport(null, convertedItems.ToArray(), true, true);

            return true;
        }


        private static ImportEntity CreateImportEntity(EntityWithHeader editInfo, int appId)
        {
            var newData = editInfo.Entity;
            var metadata = editInfo.Header.Metadata;
            // TODO 2tk: Refactor code - we use methods from XML import extensions!
            var importEntity = new ImportEntity();
            if (newData.Id == 0 && newData.Guid == Guid.Empty)
            {   // New entity
                importEntity.EntityGuid = Guid.NewGuid();
            }
            else
            {
                importEntity.EntityGuid = newData.Guid;
            }
            importEntity.IsPublished = newData.IsPublished;
                                             // todo 2rm - date picker shouldn't have time zones (maybe talk to 2tk before fixing the  bug)

            // Content type
            importEntity.AttributeSetStaticName = newData.Type.StaticName;

            importEntity.AssignmentObjectTypeId = Constants.DefaultAssignmentObjectTypeId;

            // Metadata if we have
            if (metadata != null && metadata.HasMetadata)
            {
                importEntity.AssignmentObjectTypeId = metadata.TargetType;
                importEntity.KeyGuid = metadata.KeyGuid;
                importEntity.KeyNumber = metadata.KeyNumber;
                importEntity.KeyString = metadata.KeyString;
            }

            // Attributes
            importEntity.Values = new Dictionary<string, List<IValueImportModel>>();

            // throw new Exception("error - must get cache to load correct cache first");
            var attributeSet = DataSource.GetCache(null, appId).GetContentType(newData.Type.StaticName);
            
            foreach (var attribute in newData.Attributes)
            {
                var attDef = attributeSet.AttributeDefinitions.First(a => a.Value.Name == attribute.Key).Value;// .GetAttributeByName(attribute.Key).Type;
                var attributeType = attDef.Type;

                foreach (var value in attribute.Value.Values)
                {
                    var importValue = importEntity.AppendAttributeValue(attribute.Key, value.Value, attributeType);

                    if (value.Dimensions == null)
                    {   // TODO2tk: Must this be done to save entities
                        importValue.AppendLanguageReference("", false);
                        continue;
                    }
                    foreach (var dimension in value.Dimensions)
                    {
                        importValue.AppendLanguageReference(dimension.Key, dimension.Value);
                    }
                }
            }

            return importEntity;
        }

        


        #region Delete calls

        /// <summary>
        /// Delete the entity specified by ID.
        /// </summary>
        /// <param name="contentType"></param>
        /// <param name="id">Entity ID</param>
        /// <param name="appId"></param>
        /// <exception cref="InvalidOperationException">Entity cannot be deleted for example when it is referenced by another object</exception>
        public void Delete(string contentType, int id, int? appId = null)
	    {
	        if (appId.HasValue)
	            AppId = appId.Value;
	        var finalAppId = appId ?? AppId;
            var found = InitialDS.List[id];
            if (found.Type.Name != contentType && found.Type.StaticName != contentType)
                throw new KeyNotFoundException("Can't find " + id + "of type '" + contentType + "'");
            if (!(CurrentContext.Entities.CanDeleteEntity(id).Item1)) // (!CurrentContext.EntCommands.CanDeleteEntity(id).Item1)
                throw new InvalidOperationException("The entity " + id  + " cannot be deleted because of it is referenced by another object.");
            CurrentContext.Entities.DeleteEntity(id);
        }

	    /// <summary>
	    /// Delete the entity specified by GUID.
	    /// </summary>
	    /// <param name="contentType"></param>
	    /// <param name="entityGuid">Entity GUID</param>
	    /// <param name="appId"></param>
	    /// <exception cref="ArgumentNullException">Entity does not exist</exception>
	    /// <exception cref="InvalidOperationException">Entity cannot be deleted for example when it is referenced by another object</exception>
	    public void Delete(string contentType, Guid entityGuid, int? appId = null)
        {
            if (appId.HasValue)
                AppId = appId.Value;
            var entity = CurrentContext.Entities.GetEntity(entityGuid);
            Delete(contentType, entity.EntityID);
        }


        #endregion


        #region History

	    [HttpGet]
	    public List<DbVersioning.EntityHistoryItem> History(int appId, int entityId)
	    {
            SetAppIdAndUser(appId);
            var versions = CurrentContext.Versioning.GetEntityHistory(entityId);
	        return versions;
	    }

	    [HttpGet]
	    public dynamic HistoryDetails(int appId, int entityId, int changeId)
	    {
            SetAppIdAndUser(appId);
            var result = CurrentContext.Versioning.GetEntityVersionValues(entityId, changeId, null, null);
	        return result;
	    }

	    [HttpGet]
	    public bool HistoryRestore(int appId, int entityId, int changeId)
	    {
	        var DefaultCultureDimension = 0;
            throw  new Exception("this is not tested yet!");
            SetAppIdAndUser(appId);
            CurrentContext.Versioning.RestoreEntityVersion(entityId, changeId, DefaultCultureDimension);
	        return true;
        }
        #endregion
    }
}